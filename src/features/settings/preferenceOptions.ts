export type PreferenceOption = {
  code: string;
  label: string;
  flag?: string;
};

export const countryOptions: PreferenceOption[] = [
  { code: 'AU', label: 'Australia', flag: '🇦🇺' },
  { code: 'CA', label: 'Canada', flag: '🇨🇦' },
  { code: 'CH', label: 'Switzerland', flag: '🇨🇭' },
  { code: 'DE', label: 'Germany', flag: '🇩🇪' },
  { code: 'FR', label: 'France', flag: '🇫🇷' },
  { code: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', label: 'India', flag: '🇮🇳' },
  { code: 'JP', label: 'Japan', flag: '🇯🇵' },
  { code: 'SG', label: 'Singapore', flag: '🇸🇬' },
  { code: 'US', label: 'United States', flag: '🇺🇸' },
  { code: 'AE', label: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', label: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'NZ', label: 'New Zealand', flag: '🇳🇿' },
  { code: 'IE', label: 'Ireland', flag: '🇮🇪' },
  { code: 'NL', label: 'Netherlands', flag: '🇳🇱' },
  { code: 'IT', label: 'Italy', flag: '🇮🇹' },
  { code: 'ES', label: 'Spain', flag: '🇪🇸' },
  { code: 'SE', label: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', label: 'Norway', flag: '🇳🇴' },
  { code: 'DK', label: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', label: 'Finland', flag: '🇫🇮' },
  { code: 'MY', label: 'Malaysia', flag: '🇲🇾' },
  { code: 'TH', label: 'Thailand', flag: '🇹🇭' },
  { code: 'ZA', label: 'South Africa', flag: '🇿🇦' },
];

export const currencyOptions: PreferenceOption[] = [
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SGD',
  'CHF',
  'AUD',
  'CAD',
  'SAR',
  'JPY',
].map(code => ({ code, label: code }));

export function optionLabel(option: PreferenceOption) {
  return [option.flag, option.label].filter(Boolean).join(' ');
}
