import type { DocumentRecord, PackageSummary } from '../../api/types';
import { calculatePackReadiness } from '../readiness/calculatePackReadiness';
const day = 86400000;
export function dueTiming(value: string | null | undefined, now = new Date()) {
  const date = value?.slice(0, 10);
  const timestamp = date ? Date.parse(`${date}T00:00:00Z`) : NaN;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((timestamp - today) / day);
  if (!Number.isFinite(days))
    return { label: 'Review details', overdue: false, order: Infinity };
  return {
    label:
      days < 0
        ? `${-days} ${days === -1 ? 'day' : 'days'} overdue`
        : days === 0
          ? 'Due today'
          : `In ${days} ${days === 1 ? 'day' : 'days'}`,
    overdue: days < 0,
    order: days,
  };
}
export function packageOverview(
  packages: PackageSummary[],
  documents: DocumentRecord[],
) {
  const ready = packages.filter(pack => {
    const result = calculatePackReadiness(pack.requirements, documents);
    return result.totalRequired > 0 && result.missingRequired === 0;
  }).length;
  return {
    ready,
    total: packages.length,
    percent: packages.length ? Math.round((ready / packages.length) * 100) : 0,
  };
}
