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

export function cleanPin(value: string) {
  return value.replace(/\D/g, '').slice(0, 6);
}

export function validatePinLoginInput(input: { email: string; pin: string }) {
  const email = normalizeEmail(input.email);
  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);
  if (!/^\d{6}$/.test(input.pin)) throw new Error('Enter your 6-digit R-pin.');
  return { email, pin: input.pin };
}

export function validateNewPassword(password: string, confirm: string) {
  if (password.trim().length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  if (password !== confirm) throw new Error('Passwords do not match.');
  return password.trim();
}
