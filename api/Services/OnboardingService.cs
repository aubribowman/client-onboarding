using OnboardingApi.Data;
using OnboardingApi.Models;

namespace OnboardingApi.Services;

public class OnboardingService(IApplicationRepository repository, TimeProvider clock)
{
    public const int MinimumAge = 18;

    // Business rules DataAnnotations can't express. Empty means valid.
    public IEnumerable<(string Field, string Message)> Validate(OnboardingRequest request)
    {
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        if (request.Personal.DateOfBirth > today.AddYears(-MinimumAge))
            yield return ("Personal.DateOfBirth", $"Account holders must be at least {MinimumAge}.");

        if (request.Financial.EmploymentStatus is EmploymentStatus.Employed or EmploymentStatus.SelfEmployed
            && string.IsNullOrWhiteSpace(request.Financial.Employer))
            yield return ("Financial.Employer", "Enter an employer or business name.");

        if (!request.AcceptedTerms)
            yield return ("AcceptedTerms", "The client must accept the account agreement.");

        foreach (var problem in RiskQuestionnaire.Validate(request.RiskAnswers))
            yield return problem;
    }

    public async Task<ClientApplication> SubmitAsync(OnboardingRequest request)
    {
        var risk = RiskQuestionnaire.Score(request.RiskAnswers);
        var now = clock.GetUtcNow();
        var sequence = await repository.NextSequenceAsync();

        var application = new ClientApplication
        {
            ReferenceNumber = $"ONB-{now:yyyy}-{sequence:D5}",
            SubmittedAt = now,
            Personal = request.Personal,
            Financial = request.Financial,
            RiskAnswers = request.RiskAnswers,
            Account = request.Account,
            RiskScore = risk.Score,
            RiskProfile = risk.Profile,
            History = [new StatusChange(ApplicationStatus.Submitted, now, null)]
        };

        return await repository.AddAsync(application);
    }

    public async Task<IReadOnlyList<ApplicationSummary>> ListAsync(ApplicationStatus? status) =>
        (await repository.ListAsync(status))
            .Select(a => new ApplicationSummary(
                a.Id, a.ReferenceNumber,
                $"{a.Personal.FirstName} {a.Personal.LastName}",
                a.Account.AccountType, a.Account.InitialDeposit,
                a.RiskProfile, a.Status, a.SubmittedAt))
            .ToList();

    public Task<ClientApplication?> GetAsync(Guid id) => repository.GetAsync(id);

    public async Task<ClientApplication> ChangeStatusAsync(ClientApplication application, StatusUpdateRequest update)
    {
        application.Status = update.Status;
        application.History.Add(new StatusChange(update.Status, clock.GetUtcNow(), update.Note));
        await repository.UpdateAsync(application);
        return application;
    }
}
