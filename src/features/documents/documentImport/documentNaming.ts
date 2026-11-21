import type { DocumentAnalysisResponse } from '../../../api/types';
import type { HealthDocumentType } from '../../../api/healthExtraction';

const HEALTH_LABELS: Record<HealthDocumentType, string> = {
  lab_report: 'Lab report',
  medical_report: 'Medical report',
  prescription: 'Prescription',
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAX_TITLE_LENGTH = 80;

// Names produced by cameras, messengers and scanners carry no meaning for the user.
const GENERIC_NAME_PATTERNS = [
  /^whatsapp/i,
  /^(img|image|dsc|dscn|pxl|photo|pic|vid|mvimg|screenshot|screen[ _-]?shot|scan|scanned|camscanner|doc|document|file|untitled|unknown|download)([\s._-]|\d|$)/i,
  /^[\d\s._:-]+$/,
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
];

const stripExtension = (name: string) => name.replace(/\.[a-z0-9]{2,5}$/i, '').trim();

export function isGenericDocumentName(name: string | null | undefined) {
  const base = stripExtension(name ?? '');
  if (!base) return true;
  return GENERIC_NAME_PATTERNS.some(pattern => pattern.test(base)) || /\d{6,}/.test(base);
}

function formatDate(iso?: string | null) {
  const match = iso && /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match ? `${match[3]} ${MONTHS[Number(match[2]) - 1] ?? ''} ${match[1]}`.replace('  ', ' ') : undefined;
}

const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const isKnownType = (type?: string) => !!type && !/^(unknown|other|unidentified)$/i.test(type.trim());

/**
 * Builds a meaningful name such as "Prescription – Divya (12 Nov 2026)" from what the analysis
 * found. Meaningful titles from the server are kept as they are.
 */
export function suggestDocumentTitle(analysis: DocumentAnalysisResponse, fileName?: string) {
  const { document } = analysis;
  const serverTitle = clean(document.title);
  const typeLabel = isKnownType(document.documentType) ? clean(document.documentType) : '';
  const needsRefinement = isGenericDocumentName(serverTitle) || serverTitle.toLowerCase() === typeLabel.toLowerCase();
  if (!needsRefinement) return serverTitle.slice(0, MAX_TITLE_LENGTH);

  const health = document.healthExtraction;
  const label = health ? HEALTH_LABELS[health.documentType] : typeLabel;
  const subject = clean(health?.patient?.name) || clean(document.fields?.nameOnDocument);
  const date = formatDate(health?.documentDate);
  const parts = [label, subject].filter(Boolean).join(' – ');
  if (parts) return (date ? `${parts} (${date})` : parts).slice(0, MAX_TITLE_LENGTH);

  const category = clean(document.category);
  if (category && category.toLowerCase() !== 'other') return `${category} document`;
  const original = fileName ?? analysis.files[0]?.originalName;
  return original && !isGenericDocumentName(original) ? stripExtension(original).slice(0, MAX_TITLE_LENGTH) : 'Document';
}
