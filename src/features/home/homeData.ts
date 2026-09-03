export const homeOverview = {
  name: 'there',
  readiness: { complete: 68, packs: 3 },
  documents: { total: 14, needsAttention: 2 },
  recent: [
    { id: '1', title: 'Passport', status: 'Up to date' },
    { id: '2', title: 'Health insurance', status: 'Needs renewal' },
  ],
} as const;
