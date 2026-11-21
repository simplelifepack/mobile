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

const datedValues = (items: VisitItem[]) =>
  items.map(visitDate).filter(date => date !== 'Undated').sort();

export function formatVisitDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function visitSummary(items: VisitItem[]) {
  const dates = [...new Set(datedValues(items))];
  const noun = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
  const range = dates.length > 1
    ? `${formatVisitDate(dates[0]!)} – ${formatVisitDate(dates[dates.length - 1]!)}`
    : dates.length
      ? formatVisitDate(dates[0]!)
      : 'date unavailable';
  return `${noun(items.length, 'document')} · ${range}`;
}

export function visitItemDetail(item: VisitItem) {
  const date = visitDate(item) === 'Undated' ? 'Date unavailable' : formatVisitDate(visitDate(item));
  return [recordTypeLabels[item.record.type], date, item.record.provider || item.record.doctor].filter(Boolean).join(' · ');
}

export function visitChooserGroups(contexts: VisitContext[], selectedId: string, query: string) {
  const needle = query.trim().toLowerCase();
  return (['doctor', 'provider', 'recent'] as const)
    .map(kind => ({
      kind,
      items: contexts
        .filter(context => context.kind === kind && (!needle || context.label.toLowerCase().includes(needle)))
        .sort((a, b) =>
          a.id === selectedId ? -1 : b.id === selectedId ? 1 : a.label.localeCompare(b.label),
        ),
    }))
    .filter(group => group.items.length);
}

const safeName = (value: string) =>
  value.replace(/[^\w.\- ]+/g, '').trim().replace(/\s+/g, '_') || 'document';

const extensionOf = (name: string) => (name.includes('.') ? name.slice(name.lastIndexOf('.')) : '');
let visitPackSequence = 0;

/** Downloads the selected documents, zips them into dated folders and returns the zip's path and name. */
export async function buildVisitPackZip(
  items: VisitItem[],
  memberName: string,
  contextLabel: string,
  plannedDate?: string,
  clinic?: string,
) {
  return buildRecordsZip(items, memberName, {
    fileLabel: `${safeName(contextLabel)}_Visit-Pack`,
    detailsName: 'visit-details.txt',
    details: [
      `Profile: ${memberName}`,
      `Selection: ${contextLabel}`,
      ...(clinic ? [`Clinic: ${clinic}`] : []),
      ...(plannedDate ? [`Visit date: ${plannedDate}`] : []),
    ],
  });
}

export async function buildMemberRecordsZip(items: VisitItem[], memberName: string) {
  return buildRecordsZip(items, memberName, {
    fileLabel: 'Health-Records',
    detailsName: 'records-details.txt',
    details: [`Profile: ${memberName}`, 'This archive contains record documents only, not profile details, readings, medicines or reminders.'],
  });
}

async function buildRecordsZip(items: VisitItem[], memberName: string, metadata: { fileLabel: string; detailsName: string; details: string[] }) {
  const zip = new JSZip();
  zip.file(metadata.detailsName, metadata.details.join('\n'));
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
      const path = count ? `${ext ? base.slice(0, -ext.length) : base}_${count + 1}${ext}` : base;
      zip.file(path, await FileSystem.readFile(file.path, 'base64'), { base64: true });
    } finally {
      await FileSystem.unlink(file.path).catch(error => console.warn('Unable to remove visit document cache', error));
    }
  }

  visitPackSequence += 1;
  const fileName = `${safeName(memberName)}_${metadata.fileLabel}-${Date.now()}-${visitPackSequence}.zip`;
  const path = `${Dirs.CacheDir}/${fileName}`;
  await FileSystem.writeFile(path, await zip.generateAsync({ type: 'base64' }), 'base64');
  return { path, fileName };
}
