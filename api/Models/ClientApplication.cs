namespace OnboardingApi.Models;

// The stored record. Kept separate from the request DTO so the API decides
// the fields the client can't set: id, reference number, score, status.
public class ClientApplication
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string ReferenceNumber { get; init; } = "";
    public DateTimeOffset SubmittedAt { get; init; } = DateTimeOffset.UtcNow;

    public PersonalInfo Personal { get; init; } = default!;
    public FinancialInfo Financial { get; init; } = default!;
    public List<RiskAnswer> RiskAnswers { get; init; } = [];
    public AccountSetup Account { get; init; } = default!;

    public int RiskScore { get; init; }
    public RiskProfile RiskProfile { get; init; }

    public ApplicationStatus Status { get; set; } = ApplicationStatus.Submitted;
    public List<StatusChange> History { get; init; } = [];
}

public record StatusChange(ApplicationStatus Status, DateTimeOffset ChangedAt, string? Note);

public record ApplicationSummary(
    Guid Id,
    string ReferenceNumber,
    string ClientName,
    AccountType AccountType,
    decimal InitialDeposit,
    RiskProfile RiskProfile,
    ApplicationStatus Status,
    DateTimeOffset SubmittedAt);

public record StatusUpdateRequest(ApplicationStatus Status, string? Note);

public record RiskQuestion(string Id, string Text, IReadOnlyList<RiskOption> Options);

public record RiskOption(int Value, string Label);

public record RiskResult(int Score, RiskProfile Profile);
