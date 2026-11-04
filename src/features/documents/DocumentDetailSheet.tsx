import React from 'react';
import {
  Fingerprint,
  FileText,
  Briefcase,
  Heart,
  Receipt,
  X,
  Trash2,
} from 'lucide-react-native';
import { AppModal } from '../../components/primitives/AppModal';
import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import type { DocumentRecord } from '../../api/web.types';
import { documentSource } from './documentFilters';
import * as S from './documentDetail.styles';
export function documentDetailFacts(doc: DocumentRecord) {
  const added = new Date(doc.createdAt);
  const source = {
    uploaded: 'Manual Upload',
    scanned: 'Scanned',
    gmail: 'Gmail',
    drive: 'Google Drive',
    digilocker: 'DigiLocker',
  }[documentSource(doc)];
  const category = (doc.category || 'Other')
    .replace(/_/g, ' ')
    .replace(/^./, v => v.toUpperCase());
  return [
    ['Category', category],
    ['Source', source],
    [
      'Added',
      Number.isNaN(added.getTime())
        ? 'Unknown'
        : added.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
    ],
    [
      'Size',
      Number.isFinite(doc.size)
        ? `${Math.max(1, Math.round(doc.size / 1024)).toLocaleString()} KB`
        : 'Unknown',
    ],
  ];
}
export function DocumentDetailSheet({
  document: doc,
  onClose,
  onPreview,
  onDelete,
  busy,
  feedback,
  children,
}: React.PropsWithChildren<{
  document: DocumentRecord;
  onClose: () => void;
  onPreview: () => void;
  onDelete: () => void;
  busy: boolean;
  feedback?: string;
}>) {
  const { theme } = useAppTheme();
  const c = theme.colors;
  const Icon = /identity/i.test(doc.category)
    ? Fingerprint
    : /employment/i.test(doc.category)
      ? Briefcase
      : /medical|health/i.test(doc.category)
        ? Heart
        : /finance/i.test(doc.category)
          ? Receipt
          : FileText;
  return (
    <AppModal visible animationType="slide" onRequestClose={onClose}>
      <S.Surface>
        <S.Header>
          <S.IconTile>
            <Icon size={22} color={c.primary} />
          </S.IconTile>
          <S.Copy>
            <AppText variant="heading">
              {doc.displayName ||
                doc.title ||
                doc.documentType.replace(/_/g, ' ')}
            </AppText>
            <AppText variant="caption" color="muted" numberOfLines={2}>
              {doc.originalName}
            </AppText>
          </S.Copy>
          <S.IconButton
            accessibilityRole="button"
            accessibilityLabel="Close document details"
            onPress={onClose}
          >
            <X size={22} color={c.textPrimary} />
          </S.IconButton>
        </S.Header>
        <S.Scroller keyboardShouldPersistTaps="handled">
          <S.Body>
            <S.Section>
              <AppText variant="label">Details</AppText>
              <S.Facts>
                {documentDetailFacts(doc).map(([label, value]) => (
                  <S.Fact key={label}>
                    <AppText color="muted">{label}</AppText>
                    <S.Value>{value}</S.Value>
                  </S.Fact>
                ))}
              </S.Facts>
            </S.Section>
            {feedback ? (
              <AppText accessibilityRole="alert" color="secondary">
                {feedback}
              </AppText>
            ) : null}
            {children}
          </S.Body>
        </S.Scroller>
        <S.Footer>
          <S.Preview
            accessibilityRole="button"
            accessibilityLabel="Preview document"
            disabled={busy}
            onPress={onPreview}
          >
            <FileText size={20} color={c.onPrimary} />
            <AppText variant="label" color="onPrimary">
              Preview
            </AppText>
          </S.Preview>
          <S.Delete
            accessibilityRole="button"
            accessibilityLabel="Delete document"
            disabled={busy}
            onPress={onDelete}
          >
            <Trash2 size={20} color={c.danger} />
          </S.Delete>
        </S.Footer>
      </S.Surface>
    </AppModal>
  );
}
