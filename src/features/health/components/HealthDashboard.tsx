import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Activity, AlertTriangle, ArrowRight, Bell, CalendarDays, ChevronRight,
  Clock, FileText, Files, Pencil, Pill, Shield, Siren,
  type LucideIcon,
} from 'lucide-react-native';

import type { HealthMember, HealthOverview, HealthRecord } from '../../../api/health.api';
import type { DocumentRecord } from '../../../api/types';
import { AppText } from '../../../components/primitives/AppText';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { formatDate, humanizeLabel } from '../../../utils/format';
import type { ReadingView } from '../healthTypes';
import { calculateMedicalReadiness } from '../medicalReadiness';
import { memberBirthDetails } from '../memberBirth';

type Props = {
  member: HealthMember;
  overview?: HealthOverview;
  records?: HealthRecord[];
  documents?: DocumentRecord[];
  readings: ReadingView[];
  onNavigate: (tab: string) => void;
  onEditProfile: () => void;
  onEditIdentity: () => void;
  onManageFamily: () => void;
  onPreview: (documentId: string) => void;
  onVisit: () => void;
  onInsurance: () => void;
  onEmergency: () => void;
  onAddReminder: () => void;
};

export function HealthDashboard({
  member, overview, records, documents, readings, onNavigate, onEditProfile, onEditIdentity,
  onManageFamily, onPreview, onVisit, onInsurance, onEmergency, onAddReminder,
}: Props) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const panel = { backgroundColor: colors.surface.default, borderColor: colors.border.default };
  const link = { color: colors.text.interactive };
  const initials = member.name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const missing = records
    ? calculateMedicalReadiness(member, records).items.filter(item => !item.ready)
    : undefined;
  const age = memberBirthDetails(member.dateOfBirth)?.age;
  const documentsById = new Map((documents ?? []).map(document => [document.id, document]));
  const upcoming = overview?.upcoming
    .slice()
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))[0];
  const recent = records?.slice().sort((a, b) =>
    (b.documentDate ?? b.createdAt).localeCompare(a.documentDate ?? a.createdAt),
  ).slice(0, 2) ?? [];
  const shortcuts: Array<{ label: string; icon: LucideIcon; tab: string }> = [
    { label: 'Records', icon: Files, tab: 'Records' },
    { label: 'Readings', icon: Activity, tab: 'Readings' },
    { label: 'Medicines', icon: Pill, tab: 'Medications' },
  ];

  const sectionHeader = (title: string, action: string, onPress: () => void, arrow = true) => (
    <View style={styles.sectionHeader}>
      <AppText variant="compactLabel" style={styles.flex}>{title}</AppText>
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={styles.link}>
        <AppText variant="caption" style={link}>{action}</AppText>
        {arrow ? <ArrowRight size={sizes.icon.sm} color={colors.icon.interactive} /> : null}
      </Pressable>
    </View>
  );

  return (
    <View style={styles.dashboard}>
      <View style={[styles.profile, panel]}>
        <View style={[styles.avatar, { backgroundColor: colors.surface.brandTint }]}>
          <AppText variant="compactLabel" style={link}>{initials}</AppText>
        </View>
        <View style={styles.flex}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${member.name}`} onPress={onEditIdentity} hitSlop={8} style={styles.nameButton}>
            <AppText variant="label" numberOfLines={1} style={styles.flex}>{member.name}</AppText>
            <Pencil size={sizes.icon.sm} color={colors.icon.interactive} />
          </Pressable>
          <AppText variant="caption" color="secondary">
            {[age !== undefined ? `${age} years` : '', member.bloodGroup].filter(Boolean).join(' · ') || humanizeLabel(member.relation)}
          </AppText>
        </View>
      </View>

      <View style={styles.shortcuts}>
        {shortcuts.map(({ label, icon: Icon, tab }) => (
          <Pressable key={tab} accessibilityRole="button" onPress={() => onNavigate(tab)} style={[styles.shortcut, panel]}>
            <Icon size={sizes.icon.md} color={colors.icon.interactive} />
            <AppText variant="caption" style={link}>{label}</AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        {sectionHeader('Upcoming', '+ Reminder', onAddReminder, false)}
        <Pressable accessibilityRole="button" accessibilityLabel="View reminders" onPress={() => onNavigate('Timeline')} style={[styles.row, panel]}>
          <View style={[styles.iconWell, { backgroundColor: colors.surface.secondary }]}><Bell size={sizes.icon.md} color={colors.icon.interactive} /></View>
          <View style={styles.flex}>
            <AppText variant="compactLabel">{upcoming?.title ?? (overview ? 'No upcoming reminders' : 'Reminders unavailable')}</AppText>
            <AppText variant="caption" style={link}>{upcoming ? formatDate(upcoming.dueDate) || 'Date not set' : overview ? 'View or add a reminder' : 'Pull to refresh'}</AppText>
          </View>
          <Clock size={sizes.icon.sm} color={colors.icon.interactive} />
        </Pressable>
      </View>

      {missing && missing.length > 0 ? (
        <Pressable accessibilityRole="button" onPress={missing.every(item => item.label === 'Prescription on file') ? () => onNavigate('Records') : onEditProfile} style={[styles.row, panel]}>
          <View style={[styles.iconWell, { backgroundColor: colors.surface.secondary }]}><AlertTriangle size={sizes.icon.md} color={colors.status.warning.icon} /></View>
          <View style={styles.flex}>
            <AppText variant="compactLabel">{missing.some(item => item.label === 'Emergency contact') ? 'Add an emergency contact' : 'Missing information'}</AppText>
            <AppText variant="caption" style={link}>{missing.some(item => item.label === 'Emergency contact') ? 'Keep someone reachable in an emergency' : missing.map(item => item.label).join(' · ')}</AppText>
          </View>
          <ChevronRight size={sizes.icon.sm} color={colors.icon.interactive} />
        </Pressable>
      ) : null}

      <View style={styles.section}>
        {sectionHeader('Latest readings', 'View all', () => onNavigate('Readings'))}
        <View style={[styles.readings, panel]}>
          {readings.length ? (
            <View style={styles.readingValues}>
              {readings.slice(0, 2).map(reading => (
                <View key={reading.id} style={styles.flex}>
                  <AppText variant="amount">{reading.value}</AppText>
                  <AppText variant="caption" color="secondary">{[reading.title, reading.unit].filter(Boolean).join(' · ')}</AppText>
                  {reading.measuredAt ? <AppText variant="caption" color="muted">{formatDate(reading.measuredAt)}</AppText> : null}
                </View>
              ))}
            </View>
          ) : <AppText variant="bodySm" color="secondary">{overview ? 'No tracked measurements yet.' : 'Readings unavailable. Pull to refresh.'}</AppText>}
          <AppText variant="caption" color="muted">Values shown as recorded; view all for details and trends.</AppText>
        </View>
      </View>

      <View style={styles.section}>
        {sectionHeader('Recent medical records', 'View all', () => onNavigate('Records'))}
        {recent.length ? recent.map(record => {
          const document = documentsById.get(record.documentId);
          const title = document?.displayName?.trim() || document?.title?.trim() || document?.originalName?.trim() || humanizeLabel(record.type);
          return (
          <Pressable key={record.id} accessibilityRole="button" accessibilityLabel={`View original ${title} document`} onPress={() => onPreview(record.documentId)} style={[styles.row, panel]}>
            <View style={[styles.iconWell, { backgroundColor: colors.surface.secondary }]}><FileText size={sizes.icon.md} color={colors.icon.interactive} /></View>
            <View style={styles.flex}>
              <AppText variant="compactLabel">{title}</AppText>
              <AppText variant="caption" style={link}>{[formatDate(record.documentDate || record.createdAt), record.provider || record.doctor].filter(Boolean).join(' · ')}</AppText>
            </View>
            <ChevronRight size={sizes.icon.sm} color={colors.icon.interactive} />
          </Pressable>
        ); }) : <View style={[styles.row, panel]}><AppText variant="bodySm" color="secondary">{records ? 'No health records yet.' : 'Records unavailable. Pull to refresh.'}</AppText></View>}
      </View>

      <View style={styles.familyRow}>
        <AppText variant="caption" color="muted" style={styles.flex}>Only {member.name}&apos;s health data is shown</AppText>
        <Pressable accessibilityRole="button" onPress={onManageFamily} hitSlop={8}><AppText variant="caption" style={link}>Manage family</AppText></Pressable>
      </View>

      <View style={styles.section}>
        {[
          { label: 'Prepare for a visit', icon: CalendarDays, onPress: onVisit, primary: true },
          { label: 'Insurance card', icon: Shield, onPress: onInsurance, primary: false },
          { label: 'Emergency info', icon: Siren, onPress: onEmergency, primary: false },
        ].map(({ label, icon: Icon, onPress, primary }) => (
          <Pressable key={label} accessibilityRole="button" onPress={onPress} style={[styles.action, {
            backgroundColor: primary ? colors.action.primary.default : colors.surface.secondary,
            borderColor: colors.border.default,
          }]}>
            <AppText variant="label" style={{ color: primary ? colors.text.onBrand : colors.text.interactive }}>{label}</AppText>
            <Icon size={sizes.icon.sm} color={primary ? colors.text.onBrand : colors.icon.interactive} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboard: { gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  profile: { borderWidth: 1, borderRadius: radius.surface, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', maxWidth: '100%' },
  avatar: { width: 38, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  shortcuts: { flexDirection: 'row', gap: 8 },
  shortcut: { flex: 1, minHeight: 52, borderWidth: 1, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 4 },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  row: { minHeight: 56, borderWidth: 1, borderRadius: radius.surface, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWell: { width: 32, height: 32, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  readings: { borderWidth: 1, borderRadius: radius.surface, padding: 12, gap: 8 },
  readingValues: { flexDirection: 'row', gap: 12 },
  familyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32 },
  action: { minHeight: 44, borderWidth: 1, borderRadius: radius.control, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
