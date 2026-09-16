import {
  normalizeEmail,
  validateLoginInput,
  validatePasswordResetInput,
  validateSignupInput,
} from '../src/features/auth/auth.validators';

describe('auth validators', () => {
  it('normalizes email consistently', () => {
    expect(normalizeEmail('  USER@Example.com  ')).toBe('user@example.com');
  });

  it('validates login input with trimmed fields', () => {
    expect(() =>
      validateLoginInput({ email: '  user@example.com  ', password: 'pass1234' }),
    ).not.toThrow();
  });

  it('rejects empty email in login', () => {
    expect(() => validateLoginInput({ email: '', password: 'pass1234' })).toThrow(
      'Email is required.',
    );
  });

  it('rejects weak passwords during signup', () => {
    expect(() =>
      validateSignupInput({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'short',
      }),
    ).toThrow('Password must be at least 8 characters.');
  });

  it('validates password reset email', () => {
    expect(() => validatePasswordResetInput(' user@example.com ')).not.toThrow();
    expect(() => validatePasswordResetInput('bad-email')).toThrow(
      'Please enter a valid email address.',
    );
  });
});
