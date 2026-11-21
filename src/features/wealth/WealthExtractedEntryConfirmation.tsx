import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import type { ExtractedReviewValues } from './WealthExtractedDetailsReview';

type Props = {
  visible: boolean;
  documentTitle: string;
  values: ExtractedReviewValues;
  currency: string;
  ownerName: string;
  userName?: string;
  missingDetails: string[];
  saving: boolean;
  error?: string;
  onConfirm: () => void;
  onBackToReview: () => void;
  onAddNominee?: () => void;
};

function balanceSummary(balance: string, currency: string) {
  if (!balance.trim()) return 'Balance not entered';
  const symbolByCurrency: Record<string, string> = {
    AED: 'AED ',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    SGD: 'S$',
    USD: '$',
  };
  return `${symbolByCurrency[currency] ?? `${currency} `}${balance}`;
}

export function WealthExtractedEntryConfirmation({
  visible,
  documentTitle,
  values,
  currency,
  ownerName,
  userName,
  missingDetails,
  saving,
  error,
  onConfirm,
  onBackToReview,
  onAddNominee,
}: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    if (!visible) setReviewed(false);
  }, [visible]);

  const entryTitle =
    values.accountName.trim() || values.entryType || 'Wealth entry';
  const entrySummary = [
    values.entryType,
    ownerName,
    balanceSummary(values.balance, currency),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onBackToReview}
    >
      <View
        style={[
          styles.root,
          {
            backgroundColor: theme.colors.surface.canvas,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View
          style={[
            styles.navigation,
            { borderBottomColor: theme.colors.border.subtle },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to review"
            hitSlop={12}
            onPress={onBackToReview}
            disabled={saving}
          >
            <ArrowLeft
              size={sizes.icon.md}
              color={theme.colors.text.interactive}
            />
          </Pressable>
          <AppText variant="title">Confirm entry</AppText>
        </View>
        <View style={styles.context}>
          <AppText variant="caption" color="interactive">
            {userName ? `${userName} · You` : 'You'}
          </AppText>
          <AppText variant="caption" color="muted">
            Private Wealth register
          </AppText>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="bodySm" color="interactive">
            Step 3 of 3 · Ready to save
          </AppText>
          <SummaryCard
            icon={
              <CheckCircle2
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
              />
            }
            title={
              values.accountRef.trim()
                ? `${entryTitle} · ${values.accountRef.trim()}`
                : entryTitle
            }
            description={entrySummary}
          />
          <SummaryCard
            icon={
              <FileText
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
              />
            }
            title="Attached original"
            description={documentTitle}
          />
          {missingDetails.length > 0 ? (
            <View
              style={[
                styles.warningCard,
                { backgroundColor: theme.colors.status.warning.surface },
              ]}
            >
              <AppText
                variant="label"
                style={{ color: theme.colors.status.warning.text }}
              >
                {missingDetails.length}{' '}
                {missingDetails.length === 1 ? 'detail' : 'details'} still
                needed
              </AppText>
              <AppText variant="bodySm">
                {missingDetails.join(' and ')}{' '}
                {missingDetails.length === 1 ? 'was' : 'were'} not in this
                document. You can add{' '}
                {missingDetails.length === 1 ? 'it' : 'them'} later from the
                holding details.
              </AppText>
              {onAddNominee && missingDetails.includes('nominee') ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add nominee information"
                  onPress={onAddNominee}
                  hitSlop={8}
                >
                  <AppText variant="label" color="interactive">
                    Add nominee information
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: reviewed }}
            onPress={() => setReviewed(value => !value)}
            style={[
              styles.reviewedCard,
              { backgroundColor: theme.colors.surface.default },
            ]}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: reviewed
                    ? theme.colors.action.primary.default
                    : 'transparent',
                  borderColor: reviewed
                    ? theme.colors.action.primary.default
                    : theme.colors.border.emphasis,
                },
              ]}
            >
              {reviewed ? (
                <Check size={sizes.icon.sm} color={theme.colors.text.onBrand} />
              ) : null}
            </View>
            <View style={styles.reviewedText}>
              <AppText variant="label">I reviewed these details</AppText>
              <AppText variant="bodySm" color="secondary">
                I checked the owner, reference and value against the original
                document.
              </AppText>
            </View>
            <ShieldCheck
              size={sizes.icon.md}
              color={theme.colors.text.interactive}
            />
          </Pressable>
          {error ? (
            <AppText variant="bodySm" color="danger">
              {error}
            </AppText>
          ) : null}
          <AppText variant="bodySm" color="secondary">
            Saving adds one holding to your register. It does not share the
            document or give anyone access.
          </AppText>
        </ScrollView>
        <View
          style={[
            styles.actions,
            { borderTopColor: theme.colors.border.subtle },
          ]}
        >
          <Button
            title={saving ? 'Saving…' : 'Confirm and save'}
            onPress={onConfirm}
            disabled={!reviewed || saving}
          />
          <Button
            title="Back to review"
            variant="secondary"
            onPress={onBackToReview}
            disabled={saving}
          />
        </View>
      </View>
    </Modal>
  );
}

function SummaryCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: theme.colors.surface.default },
      ]}
    >
      {icon}
      <View style={styles.summaryText}>
        <AppText variant="label" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="bodySm" color="secondary" numberOfLines={2}>
          {description}
        </AppText>
      </View>
      <CheckCircle2
        size={sizes.icon.md}
        color={theme.colors.text.interactive}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navigation: {
    minHeight: sizes.header,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  context: {
    minHeight: 23,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  summaryCard: {
    minHeight: sizes.listRow,
    borderRadius: radius.surface,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: { flex: 1, gap: 4 },
  warningCard: {
    borderRadius: radius.surface,
    padding: 12,
    gap: 6,
  },
  reviewedCard: {
    minHeight: sizes.listRow + 20,
    borderRadius: radius.surface,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: sizes.icon.md,
    height: sizes.icon.md,
    borderWidth: 1,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewedText: { flex: 1, gap: 4 },
  actions: {
    padding: 16,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
