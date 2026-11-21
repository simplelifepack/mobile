import React, { useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  ContactRound,
  UserRoundPlus,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useAppSelector } from '../../app/store/hooks';
import {
  trustApi,
  type TrustMember,
  type TrustMemberPayload,
} from '../../api/trust.api';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { sizes } from '../../design/tokens/sizes';
import { radius } from '../../design/tokens/radius';
import { space, spacing } from '../../design/tokens/spacing';
import { EmergencyPersonSheet } from './EmergencyPersonSheet';
import { QuietPeriodScreen } from './QuietPeriodScreen';
import {
  quietPeriodPreference,
  type QuietPeriodHours,
} from './quietPeriodPreference';

export function EmergencyAccessScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useAppTheme();
  const userId = useAppSelector(state => state.auth.user?.id);
  const userName = useAppSelector(state => state.auth.user?.name);
  const [members, setMembers] = useState<TrustMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [sheet, setSheet] = useState<'add' | TrustMember>();
  const [quietPeriod, setQuietPeriod] = useState<QuietPeriodHours>(24);
  const [quietPeriodError, setQuietPeriodError] = useState<string>();
  const [quietPeriodVisible, setQuietPeriodVisible] = useState(false);

  const load = async () => {
    try {
      const result = await trustApi.get();
      setMembers(result.members);
      setError(undefined);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load emergency access.',
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    quietPeriodPreference
      .read(userId)
      .then(hours => {
        if (active) {
          setQuietPeriod(hours);
          setQuietPeriodError(undefined);
        }
      })
      .catch(preferenceError => {
        if (active) {
          setQuietPeriodError(
            preferenceError instanceof Error
              ? preferenceError.message
              : 'Unable to load the quiet period preference.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [userId]);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const save = async (payload: TrustMemberPayload) => {
    setBusy(true);
    try {
      if (sheet && sheet !== 'add') {
        await trustApi.update(sheet.id, {
          name: payload.name,
          ...(payload.email !== sheet.email.trim()
            ? { email: payload.email }
            : {}),
          relation: payload.relation,
          customRelation: payload.customRelation,
          ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
        });
      } else {
        await trustApi.add(payload);
      }
      setSheet(undefined);
      await load();
    } catch (saveError) {
      await load();
      throw new Error(
        `${saveError instanceof Error ? saveError.message : 'Unable to save this person.'} Any earlier access changes may have been applied; check the list before retrying.`,
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async (member: TrustMember) => {
    setBusy(true);
    try {
      await trustApi.remove(member.id);
      setSheet(undefined);
      await load();
    } catch (removeError) {
      throw new Error(
        removeError instanceof Error
          ? removeError.message
          : 'Unable to remove this trusted person.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen padded={false}>
      <Stack gap="sm" style={styles.container}>
        <Row align="center" gap="sm" style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <ArrowLeft
              size={sizes.icon.md}
              color={theme.colors.icon.interactive}
            />
          </Pressable>
          <AppText variant="overviewTitle">Trusted people</AppText>
        </Row>
        <Row
          align="center"
          justify="space-between"
          style={styles.familyContext}
        >
          <AppText variant="caption" color="interactive">
            {userName ? `${userName} · You` : 'You'}
          </AppText>
          <AppText variant="caption" color="secondary">
            Private Wealth register
          </AppText>
        </Row>
        {error ? (
          <View style={styles.error}>
            <ErrorState message={error} />
          </View>
        ) : null}
        {loading ? (
          <View style={styles.loading}>
            <LoadingState label="Loading trusted people…" />
          </View>
        ) : null}
        {!loading && !error ? (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  tintColor={theme.colors.text.interactive}
                  colors={[theme.colors.text.interactive]}
                />
              }
            >
              {members.length ? (
                <>
                  <AppText variant="heading">
                    People your family can rely on
                  </AppText>
                  <AppText variant="bodySm" color="secondary">
                    Only people you select during an SOS handoff receive your
                    Wealth register. Adding a person does not share anything.
                  </AppText>
                  {members.map(member => {
                    const verificationPending =
                      member.invitationStatus === 'PENDING';
                    const verificationStatus = verificationPending
                      ? 'Email verification pending · Not eligible for handoff'
                      : member.invitationStatus === 'ACCEPTED'
                        ? 'Email verified'
                        : member.invitationStatus === 'EXPIRED'
                          ? 'Invitation expired'
                          : member.invitationStatus === 'REJECTED' ||
                              member.status === 'REJECTED'
                            ? 'Invite not accepted'
                            : member.status === 'ACTIVE'
                              ? 'Email verified'
                              : 'Invite not accepted';

                    return (
                      <Pressable
                        key={member.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${member.name}, ${member.relationLabel}, ${member.email}`}
                        disabled={busy}
                        onPress={() => setSheet(member)}
                        style={({ pressed }) => [
                          styles.personRow,
                          {
                            backgroundColor: theme.colors.surface.raised,
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        {verificationPending ? (
                          <Clock3
                            size={sizes.icon.md}
                            color={theme.colors.icon.interactive}
                          />
                        ) : (
                          <ContactRound
                            size={sizes.icon.md}
                            color={theme.colors.icon.interactive}
                          />
                        )}
                        <View style={styles.infoCopy}>
                          <AppText variant="label" numberOfLines={1}>
                            {member.name} · {member.relationLabel}
                          </AppText>
                          <AppText
                            variant="bodySm"
                            color="secondary"
                            numberOfLines={1}
                          >
                            {member.email}
                          </AppText>
                          <AppText
                            variant={verificationPending ? 'caption' : 'bodySm'}
                            color="secondary"
                            numberOfLines={verificationPending ? 2 : 1}
                          >
                            {verificationPending
                              ? verificationStatus
                              : `${member.phone || 'Phone not added'} · ${verificationStatus}`}
                          </AppText>
                        </View>
                        <ChevronRight
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      </Pressable>
                    );
                  })}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Set quiet period"
                    onPress={() => setQuietPeriodVisible(true)}
                    style={({ pressed }) => [
                      styles.infoRow,
                      { backgroundColor: theme.colors.surface.raised },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Clock3
                      size={sizes.icon.md}
                      color={theme.colors.icon.interactive}
                    />
                    <View style={styles.infoCopy}>
                      <AppText variant="label">Quiet period</AppText>
                      <AppText variant="bodySm" color="secondary">
                        {quietPeriodError
                          ? 'Saved preference unavailable'
                          : `${quietPeriod === 0 ? 'No wait' : `${quietPeriod} hours`} · device only; delivery remains immediate`}
                      </AppText>
                    </View>
                    <ChevronRight
                      size={sizes.icon.md}
                      color={theme.colors.icon.interactive}
                    />
                  </Pressable>
                  <Card
                    style={[
                      styles.controlCard,
                      { backgroundColor: theme.colors.surface.brandTint },
                    ]}
                  >
                    <AppText variant="label" color="interactive">
                      You control every handoff
                    </AppText>
                    <AppText variant="bodySm">
                      Contacts cannot browse your private vault or move money.
                      They receive a read-only register and the documents you
                      share.
                    </AppText>
                  </Card>
                </>
              ) : (
                <>
                  <Card
                    style={[
                      styles.emptyCard,
                      { backgroundColor: theme.colors.surface.brandTint },
                    ]}
                  >
                    <AppText variant="label" color="interactive">
                      Choose someone you trust
                    </AppText>
                    <AppText variant="bodySm">
                      No trusted people added. Nothing can be shared until you
                      add someone and verify at least one contact.
                    </AppText>
                  </Card>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add a family member or someone who can help your family"
                    disabled={busy}
                    onPress={() => setSheet('add')}
                    style={({ pressed }) => [
                      styles.infoRow,
                      { backgroundColor: theme.colors.surface.raised },
                      pressed && styles.pressed,
                    ]}
                  >
                    <UserRoundPlus
                      size={sizes.icon.md}
                      color={theme.colors.status.danger.text}
                    />
                    <View style={styles.infoCopy}>
                      <AppText variant="label">Who should I add?</AppText>
                      <AppText variant="bodySm" color="secondary">
                        A family member or someone who can help your family.
                      </AppText>
                    </View>
                    <ChevronRight
                      size={sizes.icon.md}
                      color={theme.colors.icon.interactive}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Set quiet period"
                    onPress={() => setQuietPeriodVisible(true)}
                    style={({ pressed }) => [
                      styles.infoRow,
                      { backgroundColor: theme.colors.surface.raised },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Clock3
                      size={sizes.icon.md}
                      color={theme.colors.icon.interactive}
                    />
                    <View style={styles.infoCopy}>
                      <AppText variant="label">
                        Quiet period ·{' '}
                        {quietPeriod === 0 ? 'No wait' : `${quietPeriod} hours`}
                      </AppText>
                      <AppText variant="bodySm" color="secondary">
                        {quietPeriodError
                          ? 'Saved preference unavailable'
                          : 'Device-only setting; delivery remains immediate'}
                      </AppText>
                    </View>
                    <ChevronRight
                      size={sizes.icon.md}
                      color={theme.colors.icon.interactive}
                    />
                  </Pressable>
                </>
              )}
            </ScrollView>
            <View
              style={[
                styles.actions,
                {
                  backgroundColor: theme.colors.surface.canvas,
                  paddingBottom: space[16],
                },
              ]}
            >
              <Button
                title="Add trusted person"
                disabled={busy}
                onPress={() => setSheet('add')}
              />
              <Button
                title="Back to Wealth"
                variant="secondary"
                onPress={() => navigation.goBack()}
              />
            </View>
          </>
        ) : null}
      </Stack>
      {sheet ? (
        <EmergencyPersonSheet
          key={sheet === 'add' ? 'add' : sheet.id}
          person={sheet === 'add' ? undefined : sheet}
          userName={userName}
          onClose={() => {
            if (!busy) setSheet(undefined);
          }}
          onSave={save}
          onRemove={() => {
            if (sheet !== 'add') return remove(sheet);
            return Promise.resolve();
          }}
        />
      ) : null}
      {quietPeriodVisible && userId ? (
        <QuietPeriodScreen
          userId={userId}
          userName={userName}
          onClose={() => setQuietPeriodVisible(false)}
          onSaved={hours => {
            setQuietPeriod(hours);
            setQuietPeriodError(undefined);
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: space[8],
    paddingHorizontal: 20,
  },
  header: { minHeight: sizes.minimumTouchTarget },
  back: {
    width: sizes.minimumTouchTarget,
    height: sizes.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyContext: { minHeight: 23 },
  scroll: { flex: 1 },
  body: { paddingTop: space[16], paddingBottom: space[16], gap: spacing.md },
  error: { padding: space[20] },
  loading: { flex: 1, justifyContent: 'center' },
  emptyCard: {
    padding: space[12],
    borderRadius: radius.surface,
    gap: space[4],
  },
  infoRow: {
    minHeight: sizes.listRow,
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[12],
    borderRadius: radius.surface,
    gap: spacing.sm,
  },
  personRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[12],
    borderRadius: radius.surface,
    gap: spacing.sm,
  },
  infoCopy: { flex: 1, gap: space[2] },
  controlCard: {
    padding: space[12],
    borderRadius: radius.surface,
    gap: space[4],
  },
  pressed: { opacity: 0.8 },
  actions: { gap: spacing.sm, paddingTop: space[16] },
});
