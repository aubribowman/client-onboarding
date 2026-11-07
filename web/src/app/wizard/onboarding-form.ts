import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { AccountType, EmploymentStatus, FundingMethod, OnboardingRequest } from '../core/models';
import { digitsOnly, minimumAge, usPhone } from '../core/validators';

// The whole wizard is one typed FormGroup with a nested group per step.
// Each step component receives only its own group.
export function createOnboardingForm(fb: FormBuilder) {
  const nn = fb.nonNullable;
  return nn.group({
    personal: nn.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, usPhone()]],
      dateOfBirth: ['', [Validators.required, minimumAge(18)]],
      addressLine1: ['', [Validators.required, Validators.maxLength(100)]],
      city: ['', [Validators.required, Validators.maxLength(60)]],
      state: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]]
    }),
    financial: nn.group({
      employmentStatus: ['Employed' as EmploymentStatus, Validators.required],
      employer: [''],
      annualIncome: fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
      netWorth: fb.control<number | null>(null, [Validators.required, Validators.min(0)])
    }),
    // Controls are added at runtime, one per question returned by the API.
    risk: fb.record<FormControl<number | null>>({}),
    account: nn.group({
      accountType: ['Individual' as AccountType, Validators.required],
      initialDeposit: fb.control<number | null>(null, [Validators.required, Validators.min(1000)]),
      fundingMethod: ['BankTransfer' as FundingMethod, Validators.required]
    }),
    acceptedTerms: [false, Validators.requiredTrue]
  });
}

export type OnboardingForm = ReturnType<typeof createOnboardingForm>;
export type OnboardingFormValue = ReturnType<OnboardingForm['getRawValue']>;

export function toRequest(value: OnboardingFormValue): OnboardingRequest {
  const { personal, financial, account, risk } = value;
  const needsEmployer = financial.employmentStatus === 'Employed' || financial.employmentStatus === 'SelfEmployed';
  return {
    personal: { ...personal, phone: digitsOnly(personal.phone), state: personal.state.toUpperCase() },
    financial: {
      employmentStatus: financial.employmentStatus,
      employer: needsEmployer ? financial.employer.trim() : null,
      annualIncome: financial.annualIncome ?? 0,
      netWorth: financial.netWorth ?? 0
    },
    riskAnswers: Object.entries(risk).map(([questionId, v]) => ({ questionId, value: v ?? 0 })),
    account: { ...account, initialDeposit: account.initialDeposit ?? 0 },
    acceptedTerms: value.acceptedTerms
  };
}
