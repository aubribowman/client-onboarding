namespace OnboardingApi.Models;

// Sent to the client as strings (see Program.cs). If you add or rename a
// value, update the matching type in web/src/app/core/models.ts and its
// label in web/src/app/core/labels.ts.

/// <summary>Review status. Allowed moves are defined in Services/StatusRules.cs.</summary>
public enum ApplicationStatus { Submitted, InReview, NeedsInfo, Approved, Declined }

/// <summary>Set from the questionnaire score; see Services/RiskQuestionnaire.cs.</summary>
public enum RiskProfile { Conservative, Moderate, Growth, Aggressive }

public enum AccountType { Individual, Joint, TraditionalIra, RothIra, Trust }

public enum FundingMethod { BankTransfer, AccountTransfer, Check }

public enum EmploymentStatus { Employed, SelfEmployed, Retired, Student, NotEmployed }
