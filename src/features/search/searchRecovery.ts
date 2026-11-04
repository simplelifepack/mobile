const words = [
  'passport',
  'aadhaar',
  'digilocker',
  'licence',
  'license',
  'insurance',
  'admission',
  'documents',
  'document',
  'wealth',
  'health',
  'loans',
  'medication',
  'package',
  'packages',
  'prescription',
  'cholesterol',
  'scholarship',
  'certificate',
  'vaccination',
  'investment',
];
function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = old;
    }
  }
  return row[b.length];
}
export function correctedSearch(query: string) {
  if (/\d/.test(query)) return query;
  return query.replace(/[a-zA-Z]{5,}/g, word => {
    const lower = word.toLowerCase();
    if (words.includes(lower)) return word;
    const matches = words.filter(candidate => distance(lower, candidate) === 1);
    return matches.length === 1 ? matches[0] : word;
  });
}
export function nextSearch(query: string, fallback = 'passport') {
  const corrected = correctedSearch(query);
  if (corrected !== query) return corrected;
  const tokens = query.trim().split(/\s+/);
  const known = tokens.find(word => words.includes(word.toLowerCase()));
  if (known && known.toLowerCase() !== query.trim().toLowerCase()) return known;
  return query.trim().toLowerCase() === fallback ? '' : fallback;
}
