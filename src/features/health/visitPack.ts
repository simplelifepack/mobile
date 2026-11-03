import JSZip from 'jszip';
import { Dirs, FileSystem } from 'react-native-file-access';

import type { HealthRecord } from '../../api/health.api';
import { documentsApi } from '../../api/documents.api';
import type { DocumentRecord } from '../../api/types';

export type VisitContext = {
  id: string;
  label: string;
  kind: 'doctor' | 'provider' | 'recent';
  recordIds: string[];
};

export type VisitItem = { record: HealthRecord; document?: DocumentRecord };

export const visitKindTitles: Record<VisitContext['kind'], string> = {
  doctor: 'Doctors',
  provider: 'Hospitals and labs',
  recent: 'Everything recent',
};

const recordTypeLabels: Record<HealthRecord['type'], string> = {
  lab_report: 'Lab report',
  medical_report: 'Medical report',
  prescription: 'Prescription',
};

export const visitDate = (item: VisitItem) =>
  item.record.documentDate || item.document?.documentDate || 'Undated';

export const visitItemLabel = (item: VisitItem) =>
  item.document?.title || item.document?.displayName || recordTypeLabels[item.record.type];

/** Doctors and providers named on records, plus the eight most recent records. */
export function buildVisitContexts(records: HealthRecord[]): VisitContext[] {
  const contexts = new Map<string, VisitContext>();
  const add = (kind: VisitContext['kind'], label: string, recordId: string) => {
    const clean = label.trim();
    if (!clean) return;
    const id = `${kind}:${clean.toLowerCase()}`;
    const current = contexts.get(id) ?? { id, label: clean, kind, recordIds: [] };
    current.recordIds.push(recordId);
    contexts.set(id, current);
  };

  records.forEach(record => {
    if (record.doctor) add('doctor', record.doctor, record.id);
    if (record.provider) add('provider', record.provider, record.id);
  });

  const recent = [...records]
    .sort((a, b) =>
      String(b.documentDate || b.createdAt).localeCompare(String(a.documentDate || a.createdAt)),
    )
    .slice(0, 8)
    .map(record => record.id);
  if (recent.length) {
    contexts.set('recent:everything', {
      id: 'recent:everything',
      label: 'Everything recent',
      kind: 'recent',
      recordIds: recent,
    });
  }

  return [...contexts.values()].sort(
    (a, b) => a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label),
  );
}

export function visitSummary(items: VisitItem[]) {
  const dates = [...new Set(items.map(visitDate).filter(date => date !== 'Undated'))].sort();
  const visits = dates.length || (items.length ? 1 : 0);
  const noun = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
  return `${noun(items.length, 'document')} from ${noun(visits, 'visit')}`;
}

const safeName = (value: string) =>
  value.replace(/[^\w.\- ]+/g, '').trim().replace(/\s+/g, '_') || 'document';

const extensionOf = (name: string) => (name.includes('.') ? name.slice(name.lastIndexOf('.')) : '');

/** Downloads the selected documents, zips them into dated folders and returns the zip's path and name. */
export async function buildVisitPackZip(
  items: VisitItem[],
  memberName: string,
  contextLabel: string,
) {
  const zip = new JSZip();
  const used = new Map<string, number>();
  const ordered = [...items].sort((a, b) => visitDate(b).localeCompare(visitDate(a)));

  for (const item of ordered) {
    const mimeType = item.document?.mimeType ?? 'application/pdf';
    const file = await documentsApi.preview(item.record.documentId, mimeType);
    try {
      const date = visitDate(item);
      const folder = date === 'Undated' ? 'undated' : date;
      const original = safeName(item.document?.originalName || visitItemLabel(item));
      const base = `${folder}/${original}`;
      const count = used.get(base) ?? 0;
      used.set(base, count + 1);
      const ext = extensionOf(base);
      const path = count ? `${base.slice(0, base.length - ext.length)}_${count + 1}${ext}` : base;
      zip.file(path, await FileSystem.readFile(file.path, 'base64'), { base64: true });
    } finally {
      await FileSystem.unlink(file.path).catch(() => undefined);
    }
  }

  const fileName = `${safeName(memberName)}_${safeName(contextLabel)}_Visit-Pack.zip`;
  const path = `${Dirs.CacheDir}/${fileName}`;
  await FileSystem.writeFile(path, await zip.generateAsync({ type: 'base64' }), 'base64');
  return { path, fileName };
}
