export function packageDownloadIds(
  requirements: Array<{
    id: string;
    status?: string;
    matchedDocument?: { id: string };
  }>,
  extras: string[],
  excluded: string[],
  skipped: string[],
) {
  return [
    ...new Set([
      ...extras.filter(id => !excluded.includes(id)),
      ...requirements.flatMap(item =>
        item.matchedDocument &&
        item.status !== 'missing' &&
        !excluded.includes(item.matchedDocument.id) &&
        !skipped.includes(item.id)
          ? [item.matchedDocument.id]
          : [],
      ),
    ]),
  ];
}
