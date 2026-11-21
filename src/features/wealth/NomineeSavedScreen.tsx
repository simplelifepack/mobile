import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ContactRound,
  FileText,
} from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import type { NomineeInformation } from './NomineeInformationScreen';

type Props = {
  visible: boolean;
  nominee: NomineeInformation;
  holdingName: string;
  accountReference: string;
  institution: string;
  accessNote: string;
  accessContactName?: string;
  accessContactPhone?: string;
  userName?: string;
  onAddAccessNote: () => void;
  onBackToHolding: () => void;
};

function registrationSummary(status: string, institution: string) {
  const normalizedStatus = status.trim();
  if (!normalizedStatus) return 'Registration status not recorded';
  if (
    normalizedStatus.toLowerCase() === 'registered with institution' &&
    institution.trim()
  ) {
    return `Recorded as registered with ${institution.trim()}`;
  }
  return `Recorded status: ${normalizedStatus}`;
}

export function NomineeSavedScreen({
  visible,
  nominee,
  holdingName,
  accountReference,
  institution,
  accessNote,
  accessContactName = '',
  accessContactPhone = '',
  userName,
  onAddAccessNote,
  onBackToHolding,
}: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onBackToHolding}
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
            accessibilityLabel="Back to holding"
            hitSlop={12}
            onPress={onBackToHolding}
          >
            <ArrowLeft
              size={sizes.icon.md}
              color={theme.colors.text.interactive}
            />
          </Pressable>
          <AppText variant="title">Nominee saved</AppText>
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
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.success,
              { backgroundColor: theme.colors.status.success.surface },
            ]}
          >
            <AppText
              variant="label"
              style={{ color: theme.colors.status.success.text }}
            >
              Nominee information updated
            </AppText>
            <AppText variant="bodySm">
              {nominee.name} · {nominee.relationship} · {nominee.allocation}%
            </AppText>
          </View>
          <SummaryCard
            icon={
              <ContactRound
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
              />
            }
            title={
              accountReference
                ? `${holdingName} · ${accountReference}`
                : holdingName
            }
            description={registrationSummary(
              nominee.registrationStatus,
              institution,
            )}
          />
          <AppText variant="bodySm" color="secondary">
            These details will appear in the holding and help your family
            understand who is recorded as the nominee.
          </AppText>
          <SummaryCard
            icon={
              <FileText
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
              />
            }
            title="Family access note"
            description={[
              accessNote.trim() || 'Add instructions to complete this holding',
              accessContactName.trim(),
              accessContactPhone.trim(),
            ]
              .filter(Boolean)
              .join(' · ')}
          />
        </ScrollView>
        <View
          style={[
            styles.actions,
            { borderTopColor: theme.colors.border.subtle },
          ]}
        >
          <Button title="Add access note" onPress={onAddAccessNote} />
          <Button
            title="Back to holding"
            variant="secondary"
            onPress={onBackToHolding}
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
    gap: 16,
  },
  success: {
    borderRadius: radius.surface,
    padding: 12,
    gap: 4,
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
  actions: {
    padding: 16,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
