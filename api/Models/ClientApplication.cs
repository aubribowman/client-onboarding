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

    // The only settable field: it changes as the application is reviewed.
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Submitted;
    public List<StatusChange> History { get; init; } = [];
}

/// <summary>One entry in an application's audit trail.</summary>
public record StatusChange(ApplicationStatus Status, DateTimeOffset ChangedAt, string? Note);

/// <summary>A row in the review queue; smaller than the full application.</summary>
public record ApplicationSummary(
    Guid Id,
    string ReferenceNumber,
    string ClientName,
    AccountType AccountType,
    decimal InitialDeposit,
    RiskProfile RiskProfile,
    ApplicationStatus Status,
    DateTimeOffset SubmittedAt);

/// <summary>Body of PATCH /api/applications/{id}/status.</summary>
public record StatusUpdateRequest(ApplicationStatus Status, string? Note);

/// <summary>A questionnaire question and its four answer options.</summary>
public record RiskQuestion(string Id, string Text, IReadOnlyList<RiskOption> Options);

public record RiskOption(int Value, string Label);

public record RiskResult(int Score, RiskProfile Profile);
