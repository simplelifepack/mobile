import { passwordError, pinError } from './accountValidation';
it.each(['Short1!', 'PASSWORD1!', 'password1!', 'Password!!', 'Password12'])(
  'rejects a password that fails a web credential requirement: %s',
  value => {
    expect(passwordError(value)).not.toBe('');
  },
);
it('accepts passwords meeting the web rules', () => {
  expect(passwordError('ValidPass12!')).toBe('');
});
it('requires numeric, matching, changed R-pins', () => {
  expect(pinError('12345', '12345')).not.toBe('');
  expect(pinError('abcdef', 'abcdef')).not.toBe('');
  expect(pinError('123456', '654321')).not.toBe('');
  expect(pinError('123456', '123456', '123456')).not.toBe('');
  expect(pinError('654321', '654321', '123456')).toBe('');
});
