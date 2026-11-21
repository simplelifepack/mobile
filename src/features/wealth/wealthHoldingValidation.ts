export type WealthHoldingValidationInput = {
  name: string;
  type: string;
  institution: string;
  accountRef: string;
  bankBranch: string;
  value: string;
  currency: string;
  balanceAsOf: string;
  renewalDate: string;
  maturityDate: string;
};

export type WealthHoldingValidationErrors = Partial<
  Record<
    | 'name'
    | 'type'
    | 'institution'
    | 'accountRef'
    | 'bankBranch'
    | 'value'
    | 'balanceAsOf'
    | 'renewalDate'
    | 'maturityDate',
    string
  >
>;

const currencySymbol: Record<string, string> = {
  AED: 'AED ',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  SGD: 'S$',
  USD: '$',
};

function isValidDate(value: string) {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const textMatch = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/.exec(value);
  const months = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];

  let year: number;
  let month: number;
  let day: number;
  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else if (textMatch) {
    day = Number(textMatch[1]);
    month = months.indexOf(textMatch[2].toLowerCase()) + 1;
    year = Number(textMatch[3]);
  } else {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return (
    month >= 1 &&
    month <= 12 &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function validateWealthHolding(
  input: WealthHoldingValidationInput,
  requireBalanceDate: boolean,
): WealthHoldingValidationErrors {
  const errors: WealthHoldingValidationErrors = {};
  if (!input.name.trim()) errors.name = 'Account name is required.';
  if (!input.type.trim()) errors.type = 'Choose a type to continue.';
  if (requireBalanceDate && !input.institution.trim()) {
    errors.institution = 'Bank is required.';
  }
  if (requireBalanceDate && !input.accountRef.trim()) {
    errors.accountRef = 'Account reference is required.';
  }
  if (requireBalanceDate && !input.bankBranch.trim()) {
    errors.bankBranch = 'Branch is required.';
  }

  const rawValue = input.value.trim().replace(/[,\s₹$€£]/g, '');
  const amount = Number(rawValue);
  if (!rawValue || !Number.isFinite(amount) || amount < 0) {
    const symbol = currencySymbol[input.currency] ?? `${input.currency} `;
    errors.value = `Enter a value of ${symbol}0 or more.`;
  }

  if (
    (requireBalanceDate && !input.balanceAsOf.trim()) ||
    (input.balanceAsOf.trim() && !isValidDate(input.balanceAsOf.trim()))
  ) {
    errors.balanceAsOf = 'Enter a valid date, e.g. 10 Nov 2026.';
  }
  if (input.renewalDate.trim() && !isValidDate(input.renewalDate.trim())) {
    errors.renewalDate = 'Enter a valid date, e.g. 10 Nov 2026.';
  }
  if (input.maturityDate.trim() && !isValidDate(input.maturityDate.trim())) {
    errors.maturityDate = 'Enter a valid date, e.g. 10 Nov 2026.';
  }

  return errors;
}
