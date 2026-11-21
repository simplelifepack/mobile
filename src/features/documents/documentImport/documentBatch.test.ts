import { DocumentBatch } from './documentBatch';
import type { SelectedDocument } from './types';

const files: SelectedDocument[] = [
  { path: '/first.pdf', fileName: 'first.pdf', mimeType: 'application/pdf' },
  { path: '/second.pdf', fileName: 'second.pdf', mimeType: 'application/pdf' },
  { path: '/third.pdf', fileName: 'third.pdf', mimeType: 'application/pdf' },
];

it('counts processed and saved documents separately, including skips', () => {
  const batch = new DocumentBatch(files, true);
  expect(batch.next()).toEqual(files[0]);
  expect(batch.next()).toBeUndefined();
  batch.markSaved();
  batch.markSaved();
  expect(batch.completeCurrent()).toBe(true);
  expect(batch.completeCurrent()).toBe(false);
  expect(batch.next()).toEqual(files[1]);
  batch.completeCurrent();
  expect(batch.snapshot()).toEqual({ total: 3, completed: 2, saved: 1, currentName: undefined, cancelled: false });
  expect(batch.next()).toEqual(files[2]);
});

it('stops only queued files and allows the current document to finish', () => {
  const batch = new DocumentBatch(files, false);
  expect(batch.next()).toEqual(files[0]);
  expect(batch.cancel()).toEqual(files.slice(1));
  expect(batch.cancel()).toEqual([]);
  expect(batch.snapshot()).toEqual({ total: 3, completed: 0, saved: 0, currentName: 'first.pdf', cancelled: true });
  batch.markSaved();
  batch.completeCurrent();
  expect(batch.next()).toBeUndefined();
  expect(batch.snapshot()).toEqual({ total: 3, completed: 1, saved: 1, currentName: undefined, cancelled: true });
});

it('cancels the entire queue before processing starts', () => {
  const batch = new DocumentBatch(files, true);
  expect(batch.cancel()).toEqual(files);
  expect(batch.next()).toBeUndefined();
  expect(files).toHaveLength(3);
});
