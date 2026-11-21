import {
  BookOpen,
  FileText,
  Fingerprint,
  HeartPulse,
  House,
  Landmark,
  Plane,
  type LucideIcon,
} from 'lucide-react-native';
import type { DocumentRecord } from '../../api/types';

export function documentIcon(document: DocumentRecord): LucideIcon {
  const identity = [
    document.documentType,
    document.category,
    document.normalizedType,
    document.displayName,
    document.title,
    document.originalName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/(aadhaar|aadhar)/.test(identity)) return Fingerprint;
  if (/passport/.test(identity)) return BookOpen;
  if (/(visa|flight|travel|hotel)/.test(identity)) return Plane;
  if (
    /(health|medical|insurance|prescription|hospital|vaccination)/.test(identity)
  ) {
    return HeartPulse;
  }
  if (
    /(finance|bank|tax|income|loan|investment|nps|mutual|salary|payslip|itr)/.test(
      identity,
    )
  ) {
    return Landmark;
  }
  if (/(property|home|lease|utility|rent|mortgage)/.test(identity)) {
    return House;
  }
  if (/(identity|license|pan|birth|citizenship)/.test(identity)) {
    return Fingerprint;
  }
  return FileText;
}
