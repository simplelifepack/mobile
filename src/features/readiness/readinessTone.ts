export type ReadinessTone = 'success' | 'warning' | 'danger';

// Single threshold for every readiness figure; always pair the colour with a word.
export function readinessTone(percent: number): ReadinessTone {
  if (percent >= 70) return 'success';
  if (percent >= 40) return 'warning';
  return 'danger';
}

export function readinessLabel(percent: number): string {
  const tone = readinessTone(percent);
  return tone === 'success' ? 'Ready' : tone === 'warning' ? 'In progress' : 'Needs attention';
}
