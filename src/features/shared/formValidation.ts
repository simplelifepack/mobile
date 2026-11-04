import type { FormField } from './RecordForm';
export function validateFields(
  fields: FormField[],
  values: Record<string, string>,
) {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = values[field.key]?.trim() ?? '';
    if (!value && field.required)
      errors[field.key] =
        `${field.label} is required. ${field.options ? 'Choose an option.' : 'Enter it here.'}`;
    else if (
      value &&
      field.type === 'number' &&
      !Number.isFinite(Number(value))
    )
      errors[field.key] =
        'Enter a number, for example 12.5. Leave out currency symbols.';
    else if (
      value &&
      field.type === 'phone' &&
      (!/^\+?[\d\s().-]+$/.test(value) ||
        value.replace(/\D/g, '').length < 7 ||
        value.replace(/\D/g, '').length > 15)
    )
      errors[field.key] =
        'Enter a full phone number, including the area or country code.';
    else if (
      value &&
      field.type === 'email' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    )
      errors[field.key] =
        'Enter a full email address, for example name@example.com.';
    else if (
      value &&
      field.type === 'date' &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(Date.parse(value)) ||
        new Date(value).toISOString().slice(0, 10) !== value)
    )
      errors[field.key] =
        'Use a real date in YYYY-MM-DD format, for example 2026-10-31.';
    else if (
      value &&
      field.options &&
      !field.options.some(
        option =>
          (typeof option === 'string' ? option : option.value) === value,
      )
    )
      errors[field.key] = 'Choose one of the available options.';
  }
  return errors;
}
