export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): string {
  const normalized = normalizeEmail(value);
  if (!normalized) return 'Email is required.';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalized)) {
    return 'Please enter a valid email address.';
  }
  return '';
}

export function validateLoginInput(input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);
  if (!password) throw new Error('Password is required.');

  return {
    email,
    password,
  };
}

export function validateSignupInput(input: {
  name: string;
  email: string;
  password: string;
}) {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (!name) throw new Error('Name is required.');

  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  return {
    name,
    email,
    password,
  };
}

export function validatePasswordResetInput(email: string) {
  const normalized = normalizeEmail(email);
  const emailError = validateEmail(normalized);
  if (emailError) throw new Error(emailError);
  return normalized;
}
