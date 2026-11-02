const dateFormat: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

// One locale-driven date format for every screen (e.g. "7 Mar 2026").
export function formatDate(value?: string | number | Date | null): string {
  if (value === undefined || value === null || value === '') return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, dateFormat);
}

// "PARENT" / "next_of_kin" -> "Parent" / "Next of kin".
export function humanizeLabel(value?: string | null): string {
  if (!value) return '';
  const text = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
