// Mirrors the C# models in api/Models. Enums travel as strings
// because the API registers JsonStringEnumConverter.

export type ApplicationStatus = 'Submitted' | 'InReview' | 'NeedsInfo' | 'Approved' | 'Declined';
export type RiskProfile = 'Conservative' | 'Moderate' | 'Growth' | 'Aggressive';
export type AccountType = 'Individual' | 'Joint' | 'TraditionalIra' | 'RothIra' | 'Trust';
export type FundingMethod = 'BankTransfer' | 'AccountTransfer' | 'Check';
export type EmploymentStatus = 'Employed' | 'SelfEmployed' | 'Retired' | 'Student' | 'NotEmployed';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // yyyy-MM-dd, maps to DateOnly
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface FinancialInfo {
  employmentStatus: EmploymentStatus;
  employer: string | null;
  annualIncome: number;
  netWorth: number;
}

export interface RiskAnswer {
  questionId: string;
  value: number;
}

export interface AccountSetup {
  accountType: AccountType;
  initialDeposit: number;
  fundingMethod: FundingMethod;
}

export interface OnboardingRequest {
  personal: PersonalInfo;
  financial: FinancialInfo;
  riskAnswers: RiskAnswer[];
  account: AccountSetup;
  acceptedTerms: boolean;
}

export interface StatusChange {
  status: ApplicationStatus;
  changedAt: string;
  note: string | null;
}

export interface ClientApplication {
  id: string;
  referenceNumber: string;
  submittedAt: string;
  personal: PersonalInfo;
  financial: FinancialInfo;
  riskAnswers: RiskAnswer[];
  account: AccountSetup;
  riskScore: number;
  riskProfile: RiskProfile;
  status: ApplicationStatus;
  history: StatusChange[];
}

export interface ApplicationSummary {
  id: string;
  referenceNumber: string;
  clientName: string;
  accountType: AccountType;
  initialDeposit: number;
  riskProfile: RiskProfile;
  status: ApplicationStatus;
  submittedAt: string;
}

export interface RiskOption {
  value: number;
  label: string;
}

export interface RiskQuestion {
  id: string;
  text: string;
  options: RiskOption[];
}

// ASP.NET Core's ValidationProblemDetails shape.
export interface ValidationProblem {
  title: string;
  status: number;
  detail?: string;
  errors?: Record<string, string[]>;
}
