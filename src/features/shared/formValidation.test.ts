import { validateFields } from './formValidation';
it('marks each invalid field and preserves valid zero values and optional blanks', () => {
  const fields = [
    { key: 'name', label: 'Name', required: true },
    { key: 'date', label: 'Date', type: 'date' as const },
    { key: 'amount', label: 'Amount', type: 'number' as const },
    { key: 'email', label: 'Email', type: 'email' as const },
  ];
  const errors = validateFields(fields, {
    name: '',
    date: '2026-02-30',
    amount: '0',
    email: 'wrong@',
  });
  expect(Object.keys(errors)).toEqual(['name', 'date', 'email']);
  expect(errors.date).toContain('YYYY-MM-DD');
  expect(errors.email).toContain('name@example.com');
  expect(
    validateFields(fields, { name: 'Test', date: '', amount: '0', email: '' }),
  ).toEqual({});
});
it('rejects truncated emergency numbers while accepting formatted international numbers and blanks', () => {
  const fields = [
    { key: 'phone', label: 'Emergency contact phone', type: 'phone' as const },
  ];
  expect(validateFields(fields, { phone: '630' }).phone).toBeTruthy();
  expect(validateFields(fields, { phone: '+91 98765 43210' })).toEqual({});
  expect(validateFields(fields, { phone: '' })).toEqual({});
});
