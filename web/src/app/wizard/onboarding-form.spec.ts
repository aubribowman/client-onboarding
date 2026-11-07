import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { createOnboardingForm, toRequest } from './onboarding-form';

describe('toRequest', () => {
  function filledForm() {
    const form = createOnboardingForm(new FormBuilder());
    form.controls.risk.addControl('horizon', new FormControl<number | null>(4, Validators.required));
    form.patchValue({
      personal: {
        firstName: 'Jordan', lastName: 'Lee', email: 'j@example.com', phone: '(615) 555-0199',
        dateOfBirth: '1995-08-20', addressLine1: '200 Broadway', city: 'Nashville', state: 'tn', postalCode: '37201'
      },
      financial: { employmentStatus: 'Retired', employer: 'Old Job Inc.', annualIncome: 40000, netWorth: 500000 },
      account: { accountType: 'RothIra', initialDeposit: 5000, fundingMethod: 'Check' },
      acceptedTerms: true
    });
    return form;
  }

  it('strips phone formatting and uppercases the state', () => {
    const request = toRequest(filledForm().getRawValue());
    expect(request.personal.phone).toBe('6155550199');
    expect(request.personal.state).toBe('TN');
  });

  it('drops the employer when the client is not employed', () => {
    expect(toRequest(filledForm().getRawValue()).financial.employer).toBeNull();
  });

  it('turns the risk record into an answer list', () => {
    expect(toRequest(filledForm().getRawValue()).riskAnswers).toEqual([{ questionId: 'horizon', value: 4 }]);
  });
});
