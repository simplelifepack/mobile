import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DocumentAnalysisResponse } from '../../api/types';
import { ActionSheet } from '../../components/primitives/ActionSheet';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { DocumentPreview } from '../documents/DocumentPreview';

export type ReviewField =
  | 'entryType'
  | 'accountName'
  | 'owner'
  | 'accountRef'
  | 'balance'
  | 'balanceAsOf'
  | 'institution'
  | 'bankBranch';

export type ExtractedReviewValues = Record<ReviewField, string>;

type Props = {
  visible: boolean;
  document: {
    id: string;
    title: string;
    analysis: DocumentAnalysisResponse['document'];
  };
  values: ExtractedReviewValues;
  userName?: string;
  owners: Array<{ id: string; name: string }>;
  selectedOwnerId: string;
  onChange: (field: ReviewField, value: string) => void;
  onOwnerChange: (id: string) => void;
  onClose: () => void;
  onContinue: () => void;
  onEnterManually: () => void;
};

function hasValue(value: unknown) {
  return (
    (typeof value === 'string' && value.trim().length > 0) ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

function foundInDocument(
  document: Props['document'],
  keys: string[],
  fallbackValue: string,
) {
  const fields = document.analysis.fields ?? {};
  const reviewFields = document.analysis.reviewFields ?? [];
  const matchingValue = Object.entries(fields).some(
    ([key, value]) =>
      keys.some(candidate => candidate.toLowerCase() === key.toLowerCase()) &&
      hasValue(value),
  );
  const matchingReview = reviewFields.some(field => {
    const label = `${field.key ?? ''} ${field.label ?? ''}`.toLowerCase();
    return (
      keys.some(key => label.includes(key.toLowerCase())) &&
      hasValue(field.value)
    );
  });
  const documentTypeMatched =
    keys.includes('documentType') &&
    document.analysis.documentType.toLowerCase() ===
      fallbackValue.toLowerCase();
  return matchingValue || matchingReview || documentTypeMatched;
}

export function WealthExtractedDetailsReview({
  visible,
  document,
  values,
  userName,
  owners,
  selectedOwnerId,
  onChange,
  onOwnerChange,
  onClose,
  onContinue,
  onEnterManually,
}: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [ownerPickerVisible, setOwnerPickerVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const ownerName =
    values.owner ||
    owners.find(owner => owner.id === selectedOwnerId)?.name ||
    'You';
  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.colors.surface.default,
      borderColor: theme.colors.border.default,
      color: theme.colors.text.primary,
    },
  ];

  const field = (
    label: string,
    key: ReviewField,
    sourceKeys: string[],
    options: { placeholder?: string; help?: string } = {},
  ) => (
    <View style={styles.field}>
      <AppText variant="bodySm" color="secondary">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        value={values[key]}
        onChangeText={value => onChange(key, value)}
        placeholder={options.placeholder ?? `Enter ${label.toLowerCase()}`}
        placeholderTextColor={theme.colors.text.tertiary}
        style={inputStyle}
        autoCapitalize="sentences"
      />
      <AppText variant="caption" color="muted">
        {foundInDocument(document, sourceKeys, values[key])
          ? 'Found in document'
          : (options.help ?? 'Not found · Check or enter manually')}
      </AppText>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
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
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={onClose}
          >
            <ArrowLeft
              size={sizes.icon.md}
              color={theme.colors.text.interactive}
            />
          </Pressable>
          <AppText variant="title">Review details</AppText>
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
            Step 2 of 3 · Check extracted information
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View original document"
            onPress={() => setPreviewVisible(true)}
            style={[
              styles.documentCard,
              { backgroundColor: theme.colors.surface.default },
            ]}
          >
            <FileText
              size={sizes.icon.md}
              color={theme.colors.text.interactive}
            />
            <View style={styles.documentDetails}>
              <AppText variant="label" numberOfLines={1}>
                {document.title}
              </AppText>
              <AppText variant="bodySm" color="secondary">
                View original document
              </AppText>
            </View>
            <ChevronRight
              size={sizes.icon.md}
              color={theme.colors.text.interactive}
            />
          </Pressable>
          <View
            style={[
              styles.notice,
              { backgroundColor: theme.colors.surface.brandTint },
            ]}
          >
            <AppText variant="label" color="interactive">
              Please check every field
            </AppText>
            <AppText variant="bodySm">
              Document extraction can make mistakes. Fields below are editable;
              compare them with the original before continuing.
            </AppText>
          </View>
          {field('Entry type', 'entryType', ['documentType', 'type'], {
            help: 'Not found · Choose a type',
          })}
          {field('Account name', 'accountName', [
            'accountName',
            'accountTitle',
            'account name',
          ])}
          <View style={styles.field}>
            <AppText variant="bodySm" color="secondary">
              Owner
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose owner"
              onPress={() => setOwnerPickerVisible(true)}
              style={inputStyle}
            >
              <AppText variant="body">{ownerName}</AppText>
            </Pressable>
            <AppText variant="caption" color="muted">
              {foundInDocument(
                document,
                [
                  'ownerName',
                  'owner',
                  'accountHolder',
                  'holderName',
                  'memberName',
                ],
                values.owner,
              )
                ? 'Found in document'
                : 'Not found · Choose an owner'}
            </AppText>
          </View>
          {field('Account reference', 'accountRef', [
            'accountNumber',
            'accountNumberMasked',
            'policyNumber',
            'referenceNumber',
            'loanAccountNumber',
          ])}
          {field('Balance', 'balance', [
            'amount',
            'totalAmount',
            'marketValue',
            'balance',
            'currentBalance',
            'outstanding',
            'coverageAmount',
            'sumAssured',
            'principalAmount',
            'value',
          ])}
          {field('Balance as of', 'balanceAsOf', [
            'balanceAsOf',
            'statementDate',
            'asOfDate',
            'date',
            'renewalDate',
            'expiryDate',
            'validTill',
            'validUntil',
          ])}
          {field('Institution', 'institution', [
            'institution',
            'issuer',
            'bankName',
            'provider',
            'insurerName',
          ])}
          {field('Bank branch', 'bankBranch', ['branchName', 'branch'])}
        </ScrollView>
        <View
          style={[
            styles.actions,
            { borderTopColor: theme.colors.border.subtle },
          ]}
        >
          <Button title="Continue to confirmation" onPress={onContinue} />
          <Button
            title="Enter details manually"
            variant="secondary"
            onPress={onEnterManually}
          />
        </View>
        <ActionSheet
          embedded
          visible={ownerPickerVisible}
          title="Choose owner"
          options={owners.map(owner => ({
            label: owner.name,
            selected: owner.id === selectedOwnerId,
            onPress: () => {
              onOwnerChange(owner.id);
              setOwnerPickerVisible(false);
            },
          }))}
          onClose={() => setOwnerPickerVisible(false)}
        />
      </View>
      {previewVisible ? (
        <DocumentPreview
          documentId={document.id}
          onClose={() => setPreviewVisible(false)}
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
    gap: 12,
  },
  documentCard: {
    minHeight: sizes.listRow,
    borderRadius: radius.surface,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentDetails: { flex: 1, gap: 4 },
  notice: {
    borderRadius: radius.surface,
    padding: 12,
    gap: 6,
  },
  field: { gap: 6 },
  input: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actions: {
    padding: 16,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
