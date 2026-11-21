import { validateWealthHolding } from './wealthHoldingValidation';

const validInput = {
  name: 'HDFC Savings',
  type: 'Savings account',
  institution: 'HDFC Bank',
  accountRef: '4821',
  bankBranch: 'Indiranagar',
  value: '480000',
  currency: 'INR',
  balanceAsOf: '2026-11-10',
  renewalDate: '',
  maturityDate: '',
};

it('reports missing name, negative balance, and invalid balance date together', () => {
  const errors = validateWealthHolding(
    {
      ...validInput,
      name: '',
      value: '-480000',
      balanceAsOf: '32 Nov 2026',
    },
    true,
  );

  expect(errors).toEqual({
    name: 'Account name is required.',
    value: 'Enter a value of ₹0 or more.',
    balanceAsOf: 'Enter a valid date, e.g. 10 Nov 2026.',
  });
});

it('requires a balance date for document entries and accepts valid calendar dates', () => {
  expect(
    validateWealthHolding({ ...validInput, balanceAsOf: '' }, true).balanceAsOf,
  ).toBe('Enter a valid date, e.g. 10 Nov 2026.');
  expect(
    validateWealthHolding({ ...validInput, balanceAsOf: '10 Nov 2026' }, true),
  ).toEqual({});
});

it('accepts zero and currency-formatted non-negative values', () => {
  expect(
    validateWealthHolding({ ...validInput, value: '₹4,80,000' }, true),
  ).toEqual({});
  expect(validateWealthHolding({ ...validInput, value: '0' }, false)).toEqual(
    {},
  );
});

it('reports missing type and rejects impossible optional dates', () => {
  expect(
    validateWealthHolding(
      { ...validInput, type: '', maturityDate: '2026-02-30' },
      false,
    ),
  ).toEqual({
    type: 'Choose a type to continue.',
    maturityDate: 'Enter a valid date, e.g. 10 Nov 2026.',
  });
});

it('requires bank, account reference, and branch details for account entries', () => {
  expect(
    validateWealthHolding(
      {
        ...validInput,
        institution: '',
        accountRef: '',
        bankBranch: '',
      },
      true,
    ),
  ).toMatchObject({
    institution: 'Bank is required.',
    accountRef: 'Account reference is required.',
    bankBranch: 'Branch is required.',
  });
});
