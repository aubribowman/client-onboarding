using OnboardingApi.Models;
using OnboardingApi.Services;

namespace OnboardingApi.Data;

// Fictional applications so the review queue isn't empty on first run.
public static class SeedData
{
    public static async Task LoadAsync(OnboardingService service)
    {
        var samples = new[]
        {
            // Answers are one per question, in RiskQuestionnaire order (1-4 each).
            Sample("Maya", "Okafor", "TN", "37203", AccountType.RothIra, 25_000m, [4, 3, 4, 3, 4]),
            Sample("Daniel", "Reyes", "GA", "30309", AccountType.Joint, 150_000m, [2, 2, 3, 3, 2]),
            Sample("Priya", "Natarajan", "AL", "35801", AccountType.Individual, 8_500m, [1, 1, 2, 2, 1])
        };

        // Goes through the normal submit path, so seed data gets real scores and reference numbers.
        foreach (var request in samples)
            await service.SubmitAsync(request);
    }

    private static OnboardingRequest Sample(
        string first, string last, string state, string zip,
        AccountType accountType, decimal deposit, int[] answers) => new()
    {
        Personal = new PersonalInfo
        {
            FirstName = first, LastName = last,
            Email = $"{first.ToLower()}.{last.ToLower()}@example.com",
            Phone = "6155550100", DateOfBirth = new DateOnly(1988, 4, 12),
            AddressLine1 = "100 Main St", City = "Sample City", State = state, PostalCode = zip
        },
        Financial = new FinancialInfo
        {
            EmploymentStatus = EmploymentStatus.Employed, Employer = "Example Co.",
            AnnualIncome = 95_000m, NetWorth = 300_000m
        },
        RiskAnswers = RiskQuestionnaire.Questions
            .Select((q, i) => new RiskAnswer { QuestionId = q.Id, Value = answers[i] })
            .ToList(),
        Account = new AccountSetup
        {
            AccountType = accountType, InitialDeposit = deposit, FundingMethod = FundingMethod.BankTransfer
        },
        AcceptedTerms = true
    };
}
