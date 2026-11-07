using System.ComponentModel.DataAnnotations;

namespace OnboardingApi.Models;

// What the Angular wizard posts on submit. [ApiController] validates the
// whole object graph and returns a 400 ValidationProblemDetails automatically.
public class OnboardingRequest
{
    [Required] public PersonalInfo Personal { get; init; } = default!;
    [Required] public FinancialInfo Financial { get; init; } = default!;
    [Required, MinLength(1)] public List<RiskAnswer> RiskAnswers { get; init; } = [];
    [Required] public AccountSetup Account { get; init; } = default!;
    public bool AcceptedTerms { get; init; }
}

public class PersonalInfo
{
    [Required, StringLength(50)] public string FirstName { get; init; } = "";
    [Required, StringLength(50)] public string LastName { get; init; } = "";
    [Required, EmailAddress] public string Email { get; init; } = "";
    [Required, RegularExpression(@"^\d{10}$", ErrorMessage = "Phone must be 10 digits.")]
    public string Phone { get; init; } = "";
    [Required] public DateOnly DateOfBirth { get; init; }
    [Required, StringLength(100)] public string AddressLine1 { get; init; } = "";
    [Required, StringLength(60)] public string City { get; init; } = "";
    [Required, RegularExpression(@"^[A-Z]{2}$", ErrorMessage = "Use a two-letter state code.")]
    public string State { get; init; } = "";
    [Required, RegularExpression(@"^\d{5}$", ErrorMessage = "ZIP code must be 5 digits.")]
    public string PostalCode { get; init; } = "";
}

public class FinancialInfo
{
    [Required] public EmploymentStatus EmploymentStatus { get; init; }
    [StringLength(100)] public string? Employer { get; init; }
    [Range(0, 100_000_000)] public decimal AnnualIncome { get; init; }
    [Range(0, 1_000_000_000)] public decimal NetWorth { get; init; }
}

public class RiskAnswer
{
    [Required] public string QuestionId { get; init; } = "";
    [Range(1, 4)] public int Value { get; init; }
}

public class AccountSetup
{
    [Required] public AccountType AccountType { get; init; }
    [Range(1000, 50_000_000, ErrorMessage = "Initial deposit must be at least $1,000.")]
    public decimal InitialDeposit { get; init; }
    [Required] public FundingMethod FundingMethod { get; init; }
}
