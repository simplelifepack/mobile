// Same credential rules as frontend-web/pages/settings.
export function passwordError(password: string) {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-z]/.test(password))
    return 'Password must include a lowercase letter.';
  if (!/[A-Z]/.test(password))
    return 'Password must include an uppercase letter.';
  if (!/\d/.test(password)) return 'Password must include a number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include a symbol.';
  return '';
}
export function pinError(pin: string, confirm: string, current?: string) {
  if (!/^\d{6}$/.test(pin)) return 'Enter a 6-digit R-pin.';
  if (pin !== confirm) return 'R-pins do not match.';
  if (current === pin)
    return 'New R-pin must be different from your current R-pin.';
  return '';
}
