export type ReadinessTone = 'success' | 'warning' | 'danger';

// Design System 1.0 bands: 100 Ready, 50-99 In progress, below 50 Needs work.
// One rule for the whole product; always show the number and a word with the colour.
export function readinessTone(percent: number): ReadinessTone {
  if (percent >= 100) return 'success';
  if (percent >= 50) return 'warning';
  return 'danger';
}

export function readinessLabel(percent: number): string {
  const tone = readinessTone(percent);
  return tone === 'success' ? 'Ready' : tone === 'warning' ? 'In progress' : 'Needs work';
}
