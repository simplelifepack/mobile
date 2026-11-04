import { normalizeDocument } from './normalizeDocument';
it('reads server metadata and respects explicit removal of an expiry date', () => {
  expect(
    normalizeDocument({
      fields: {
        owner: 'spouse',
        expiry: '2026-12-01',
        userExpiry: null,
        capabilities: ['identity_proof'],
        issueDate: '2025-01-02',
      },
    }),
  ).toMatchObject({
    owner: 'spouse',
    expiryDate: null,
    documentDate: '2025-01-02',
    capabilities: ['identity_proof'],
  });
});
it('keeps unknown ownership distinct from the current account owner', () => {
  expect(normalizeDocument({ fields: {} }).owner).toBe('unknown');
});

it('uses verified ownership when legacy metadata has no owner, preserving explicit relationships', () => {
  expect(
    normalizeDocument({ ownershipStatus: 'verified', fields: {} }).owner,
  ).toBe('self');
  expect(
    normalizeDocument({
      ownershipStatus: 'verified',
      fields: { owner: 'spouse' },
    }).owner,
  ).toBe('spouse');
  expect(
    normalizeDocument({ ownershipStatus: 'mismatch', fields: {} }).owner,
  ).toBe('unknown');
});
