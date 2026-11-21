import type { HealthMeasurement } from '../../api/health.api';







export const tabs = [
  'Overview',
  'Readings',
  'Timeline',
  'Medications',
  'Records',
];


export type ReadingView = {
  id: string;
  title: string;
  value: string;
  unit: string;
  status: string;
  range?: string;
  measurements: HealthMeasurement[];
  color: 'danger' | 'primary';
  sourceName?: string;
  measuredAt?: string | null;
};


// ============================================================================
// HELPERS
// ============================================================================
