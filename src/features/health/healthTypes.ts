





export const tabs = [
  'Overview',
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
  dates: string[];
  values: number[];
  color: 'danger' | 'primary';
  sourceName?: string;
};


// ============================================================================
// HELPERS
// ============================================================================
