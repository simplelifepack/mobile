/** Common spellings should find the canonical Aadhaar name stored by the API. */
export function normalizeGlobalSearchQuery(query: string) {
  return query
    .trim()
    .replace(/\b(?:aadhar|adhaar|adhar)\b/gi, 'aadhaar')
    .slice(0, 160);
}
