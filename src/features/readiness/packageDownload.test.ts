import { packageDownloadIds } from './packageDownload';
it('honors exclusions and skipped requirements without dropping documents still used elsewhere', () => {
  const requirements = [
    { id: 'skip', matchedDocument: { id: 'shared' } },
    { id: 'keep', matchedDocument: { id: 'shared' } },
    { id: 'exclude', matchedDocument: { id: 'excluded' } },
    { id: 'skip-only', matchedDocument: { id: 'skipped' } },
  ];
  expect(
    packageDownloadIds(
      requirements,
      ['extra', 'extra'],
      ['excluded'],
      ['skip', 'skip-only'],
    ),
  ).toEqual(['extra', 'shared']);
  expect(
    packageDownloadIds(requirements, [], ['shared', 'excluded', 'skipped'], []),
  ).toEqual([]);
});

it('excludes unusable requirement matches unless explicitly added as extra documents', () => {
  const requirements = [
    { id: 'expired', status: 'missing', matchedDocument: { id: 'old-doc' } },
  ];
  expect(packageDownloadIds(requirements, [], [], [])).toEqual([]);
  expect(packageDownloadIds(requirements, ['old-doc'], [], [])).toEqual([
    'old-doc',
  ]);
});

it('honors deselected extra files without removing other selected files', () => {
  expect(packageDownloadIds([], ['extra', 'keep'], ['extra'], [])).toEqual([
    'keep',
  ]);
});
