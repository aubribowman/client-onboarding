namespace OnboardingApi.Models;

public enum ApplicationStatus { Submitted, InReview, NeedsInfo, Approved, Declined }

public enum RiskProfile { Conservative, Moderate, Growth, Aggressive }

public enum AccountType { Individual, Joint, TraditionalIra, RothIra, Trust }

public enum FundingMethod { BankTransfer, AccountTransfer, Check }

public enum EmploymentStatus { Employed, SelfEmployed, Retired, Student, NotEmployed }
