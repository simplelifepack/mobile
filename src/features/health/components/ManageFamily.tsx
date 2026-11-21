import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, Info, Phone, UserRound } from 'lucide-react-native';

import type { HealthMember } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { humanizeLabel } from '../../../utils/format';
import { memberBirthDetails } from '../memberBirth';

export function isDefaultProfile(member: HealthMember) {
  return ['myself', 'self', 'you'].includes(member.relation.trim().toLowerCase());
}

function birthDetails(value?: string | null) {
  const details = memberBirthDetails(value);
  if (!details) return undefined;
  return details.age !== undefined ? `${details.formatted} · ${details.age} years` : details.formatted;
}

export function ManageFamily({ members, selectedId, detailId, contacts, onView, onContacts, onEdit, onEditIdentity, onRemove, onAdd, busy }: {
  members: HealthMember[];
  selectedId: string;
  detailId?: string;
  contacts: boolean;
  onView: (id: string) => void;
  onContacts: () => void;
  onEdit: (member: HealthMember) => void;
  onEditIdentity: (member: HealthMember) => void;
  onRemove: (member: HealthMember) => void;
  onAdd: () => void;
  busy: boolean;
}) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const member = members.find(item => item.id === detailId);
  const panel = { backgroundColor: colors.surface.default, borderColor: colors.border.default };
  const contactLabel = (item: HealthMember) => [item.emergencyContactName, item.emergencyContactPhone].filter(Boolean).join(' · ');
  const detailRow = (label: string, value?: string | null) => (
    <View key={label} style={styles.detailRow}>
      <AppText variant="caption" color="secondary" style={styles.label}>{label}</AppText>
      <AppText variant="bodySm" style={styles.flex}>{value || 'Not added'}</AppText>
    </View>
  );
  const contactCard = (item: HealthMember) => (
    <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Edit emergency contact for ${item.name}`} onPress={() => onEdit(item)} style={[styles.row, panel]}>
      <View style={[styles.icon, { backgroundColor: colors.surface.secondary }]}><Phone size={sizes.icon.md} color={colors.icon.interactive} /></View>
      <View style={styles.flex}>
        <AppText variant="compactLabel">{contacts ? item.name : item.emergencyContactName || 'Emergency contact not added'}</AppText>
        <AppText variant="caption" style={{ color: colors.text.interactive }}>{contacts ? contactLabel(item) || 'Not added' : item.emergencyContactPhone || 'Add contact details'}</AppText>
      </View>
      <ChevronRight size={sizes.icon.sm} color={colors.icon.interactive} />
    </Pressable>
  );

  if (contacts) return (
    <View style={styles.container}>
      <AppText variant="bodySm" color="secondary">Review who to call for each family member.</AppText>
      {members.map(contactCard)}
    </View>
  );
  if (member) return (
    <View style={styles.container}>
      <View style={[styles.panel, panel]}>
        <AppText variant="heading">{member.name}</AppText>
        {detailRow('Relationship', humanizeLabel(member.relation))}
        {detailRow('Date of birth', birthDetails(member.dateOfBirth))}
        {detailRow('Sex', 'Unavailable')}
      </View>
      <View style={styles.sectionHeading}>
        <AppText variant="compactLabel" style={styles.flex}>Medical information</AppText>
        <Pressable accessibilityRole="button" onPress={() => onEdit(member)}><AppText variant="caption" style={{ color: colors.text.interactive }}>Edit</AppText></Pressable>
      </View>
      <View style={[styles.panel, panel]}>
        {detailRow('Blood group', member.bloodGroup)}
        {detailRow('Allergies', member.allergies)}
        {detailRow('Health notes', member.conditions)}
        {detailRow('Current medicine', 'See Medicines')}
        {detailRow('Doctor', [member.primaryDoctor, member.preferredHospital].filter(Boolean).join(' · '))}
      </View>
      <AppText variant="compactLabel">Emergency contact</AppText>
      {contactCard(member)}
      <View style={[styles.notice, { backgroundColor: colors.surface.secondary }]}>
        <Info size={sizes.icon.sm} color={colors.icon.secondary} />
        <AppText variant="caption" color="secondary" style={styles.flex}>Medical details are user-provided, not clinically verified.</AppText>
      </View>
      <Button title="Edit profile" variant="secondary" disabled={busy} onPress={() => onEditIdentity(member)} />
      {isDefaultProfile(member) ? <AppText variant="caption" color="secondary">The default health profile cannot be removed.</AppText> :
        <Button title={busy ? 'Removing…' : 'Remove profile'} variant="secondary" disabled={busy} onPress={() => onRemove(member)} />}
    </View>
  );
  return (
    <View style={styles.container}>
      <AppText variant="bodySm" color="secondary">Keep each person&apos;s health information separate and easy to find.</AppText>
      <View style={styles.sectionHeading}>
        <AppText variant="compactLabel" style={styles.flex}>Your family</AppText>
        <AppText variant="caption" style={{ color: colors.text.interactive }}>{members.length} {members.length === 1 ? 'profile' : 'profiles'}</AppText>
      </View>
      {members.map(item => (
        <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`View ${item.name}'s profile`} onPress={() => onView(item.id)}
          style={[styles.row, panel, item.id === selectedId && { backgroundColor: colors.selection.surface, borderColor: colors.border.interactive }]}>
          <View style={[styles.icon, { backgroundColor: colors.surface.secondary }]}><UserRound size={sizes.icon.md} color={colors.icon.interactive} /></View>
          <View style={styles.flex}>
            <AppText variant="compactLabel">{item.name}</AppText>
            <AppText variant="caption" style={{ color: colors.text.interactive }}>
              {[humanizeLabel(item.relation), birthDetails(item.dateOfBirth)?.split(' · ')[1], item.bloodGroup, item.id === selectedId ? 'Active profile' : ''].filter(Boolean).join(' · ')}
            </AppText>
          </View>
          <ChevronRight size={sizes.icon.sm} color={colors.icon.interactive} />
        </Pressable>
      ))}
      <View style={[styles.notice, { backgroundColor: colors.surface.secondary }]}>
        <Info size={sizes.icon.sm} color={colors.icon.secondary} />
        <AppText variant="caption" color="secondary" style={styles.flex}>Adding a profile does not invite that person or share your vault. You manage the information stored here.</AppText>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Emergency contacts" onPress={onContacts} style={[styles.row, panel]}>
        <View style={[styles.icon, { backgroundColor: colors.surface.secondary }]}><Phone size={sizes.icon.md} color={colors.icon.interactive} /></View>
        <View style={styles.flex}><AppText variant="compactLabel">Emergency contacts</AppText><AppText variant="caption" style={{ color: colors.text.interactive }}>Review who to call for each family member</AppText></View>
        <ChevronRight size={sizes.icon.sm} color={colors.icon.interactive} />
      </Pressable>
      <Button title="Add profile" onPress={onAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderWidth: 1, borderRadius: radius.surface },
  icon: { width: 36, height: 36, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  panel: { borderWidth: 1, borderRadius: radius.surface, padding: 16, gap: 12 },
  detailRow: { flexDirection: 'row', gap: 12 },
  label: { width: 110 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radius.control, gap: 8, padding: 12 },
});
