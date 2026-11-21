import type { DocumentRecord } from '../../api/types';
import { documentExpiry } from '../documents/documentDetails';

const DAY = 86_400_000;

export function documentAttention(document: DocumentRecord, now = new Date()) {
  const expiry = documentExpiry(document);
  if (!expiry) return undefined;
  const [year, month, day] = expiry.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = (date.getTime() - today) / DAY;
  if (days > 60) return undefined;
  const label = days < 0
    ? `Expired ${-days} ${days === -1 ? 'day' : 'days'} ago`
    : days === 0 ? 'Expires today' : `Expires in ${days} ${days === 1 ? 'day' : 'days'}`;
  return { days, label, overdue: days < 0 };
}
