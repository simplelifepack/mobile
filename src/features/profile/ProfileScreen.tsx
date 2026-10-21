import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import {
  ArrowLeft,
  ChevronRight,
  CircleHelp,
  Info,
  LockKeyhole,
  Mail,
  MessageSquare,
  LogOut,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';

import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { AppText } from '../../components/primitives/AppText';
import { Row } from '../../components/primitives/Row';

import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { logout, logoutAll, restoreSession } from '../auth/authSlice';
import { api } from '../../services/api';

import { useAppTheme } from '../../design/theme/ThemeProvider';
import {
  SectionTitle,
  SettingsCard,
  SettingsRow,
} from './SettingsPrimitives';
import { CredentialChangeModal } from './CredentialChangeModal';
import { PinChangeModal } from './PinChangeModal';
import { AccountDataSection } from './AccountDataSection';
import { DeleteAccountModal } from './ProfileDialogs';
import { PreferencesSection } from './PreferencesSection';
import { accountApi } from '../../api/account.api';

export function ProfileScreen() {
  const { theme } = useAppTheme();

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const dispatch = useAppDispatch();

  const { user, submitting } = useAppSelector(
    state => state.auth,
  );

  const [changeKind, setChangeKind] =
    useState<'email' | 'password'>();

  const [pinVisible, setPinVisible] = useState(false);

  const [deleteVisible, setDeleteVisible] =
    useState(false);

  const [deletePhrase, setDeletePhrase] =
    useState('');

  const [deleteError, setDeleteError] =
    useState<string>();

  /**
   * Sign out
   */
  const signOut = async () => {
    await dispatch(logout());
    dispatch(api.util.resetApiState());
  };

  const signOutEverywhere = () => {
    Alert.alert(
      'Sign out of all devices?',
      'You will be signed out here and on every other device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out everywhere',
          style: 'destructive',
          onPress: async () => {
            const result = await dispatch(logoutAll());
            if (logoutAll.fulfilled.match(result)) {
              dispatch(api.util.resetApiState());
            } else {
              Alert.alert('Unable to sign out everywhere', 'Please try again.');
            }
          },
        },
      ],
    );
  };

  /**
   * Delete account
   */
  const scheduleDeletion = async () => {
    if (deletePhrase !== 'delete my account') {
      return;
    }

    setDeleteError(undefined);

    try {
      await accountApi.scheduleDeletion(
        deletePhrase,
      );

      setDeleteVisible(false);
      setDeletePhrase('');

      await dispatch(logout());
      dispatch(api.util.resetApiState());
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Unable to schedule deletion.',
      );
    }
  };

  /**
   * Emergency access currently maps to the
   * existing Family screen because that is already
   * available in RootStackParamList.
   */
  const openEmergencyAccess = () => {
    navigation.navigate('Family');
  };

  /**
   * Support actions.
   *
   * These use Alert for now because the existing
   * navigation type does not expose dedicated
   * support routes.
   */
  const openWhatsNew = () => {
    Alert.alert(
      "What's new",
      'Latest changes in ReadiNes',
    );
  };

  const openHelp = () => {
    Alert.alert(
      'Help and FAQs',
      'Straight answers, including the uncomfortable ones.',
    );
  };

  const openFeedback = () => {
    Alert.alert(
      'Send feedback',
      'Tell us what is broken or missing.',
    );
  };

  const openPrivacy = () => {
    Alert.alert(
      'Privacy and terms',
      'How your data is handled.',
    );
  };

  const openAbout = () => {
    Alert.alert(
      'About ReadiNes',
      'ReadiNes — Be ready for life’s important moments.',
    );
  };

  return (
    <Screen scroll>
      <Stack style={styles.container}>

        {/* =====================================================
            HEADER
        ====================================================== */}

        <Row
          align="center"
          gap="sm"
          style={styles.header}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={styles.backButton}
          >
            <ArrowLeft
              size={22}
              strokeWidth={2}
              color={theme.colors.textPrimary}
            />
          </Pressable>

          <AppText
            variant="title"
            style={styles.headerTitle}
          >
            Settings
          </AppText>
        </Row>


        {/* =====================================================
            ACCOUNT
        ====================================================== */}

        <SectionTitle title="ACCOUNT" />

        <SettingsCard>

          {/* Profile */}
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>
                {(user?.name?.charAt(0) ?? 'R').toUpperCase()}
              </AppText>
            </View>

            <View style={styles.profileContent}>
              <AppText style={styles.profileName}>
                {user?.name ?? 'Ravi'}
              </AppText>

              <View style={styles.profileDivider} />

              <AppText
                style={styles.profileEmail}
                color="secondary"
              >
                {user?.email ?? 'dev@readines.app'}
              </AppText>
            </View>
          </View>


          {/* Emergency access */}
          <SettingsRow
            icon={
              <Users
                size={25}
                color={theme.colors.primary}
                strokeWidth={1.8}
              />
            }
            title="Emergency access"
            subtitle="Members, access levels, emergency contacts, and SOS handoff"
            onPress={openEmergencyAccess}
          />


          {/* Change email */}
          <SettingsRow
            icon={
              <Mail
                size={25}
                color={theme.colors.primary}
                strokeWidth={1.8}
              />
            }
            title="Change email"
            subtitle={
              user?.email ??
              'dev@readines.app'
            }
            onPress={() =>
              setChangeKind('email')
            }
          />


          {/* Change password */}
          <SettingsRow
            icon={
              <LockKeyhole
                size={25}
                color={theme.colors.primary}
                strokeWidth={1.8}
              />
            }
            title="Change password"
            onPress={() =>
              setChangeKind('password')
            }
            showSubtitle={false}
          />


          {/* R-pin */}
          <SettingsRow
            icon={
              <LockKeyhole
                size={25}
                color={theme.colors.primary}
                strokeWidth={1.8}
              />
            }
            title="Change R-pin"
            subtitle="Change or reset your 6-digit R-pin"
            onPress={() => setPinVisible(true)}
          />

        </SettingsCard>


        <PreferencesSection />

        <AccountDataSection />

        {/* =====================================================
            SUPPORT
        ====================================================== */}

        <SectionTitle title="SUPPORT" />

        <SettingsCard>

          {/* What's new */}
          <SettingsRow
            icon={
              <Sparkles
                size={25}
                color={theme.colors.primary}
                strokeWidth={1.8}
              />
            }
            title="What's new"
            subtitle="Latest changes in ReadiNes"
            rightContent={
              <View style={styles.versionRow}>
                <AppText
                  style={styles.versionText}
                  color="secondary"
                >
                  v0.9
                </AppText>

                <ChevronRight
                  size={21}
                  color={theme.colors.textSecondary}
                  strokeWidth={2}
                />
              </View>
            }
            onPress={openWhatsNew}
          />


          {/* Help */}
          <SettingsRow
            icon={
              <CircleHelp
                size={25}
                color={theme.colors.primary}
                strokeWidth={1.8}
              />
            }
            title="Help and FAQs"
            subtitle="Straight answers, including the uncomfortable ones"
            onPress={openHelp}
          />


          {/* Feedback */}
          <SettingsRow
            icon={
              <MessageSquare
                size={25}
                color={theme.colors.primary}
                strokeWidth={1.8}
              />
            }
            title="Send feedback"
            subtitle="Tell us what is broken or missing"
            onPress={openFeedback}
          />


          {/* Privacy */}
          <SettingsRow
            icon={
              <ShieldCheck
                size={25}
                color={theme.colors.primary}
                strokeWidth={1.8}
              />
            }
            title="Privacy and terms"
            subtitle="How your data is handled"
            onPress={openPrivacy}
          />


          {/* About */}
          <SettingsRow
            icon={
              <Info
                size={25}
                color={theme.colors.primary}
                strokeWidth={1.8}
              />
            }
            title="About ReadiNes"
            showSubtitle={false}
            onPress={openAbout}
          />

        </SettingsCard>


        {/* =====================================================
            DANGER ZONE
        ====================================================== */}

        <SectionTitle
          title="DANGER ZONE"
          danger
        />

        <View
          style={[
            styles.dangerCard,
            {
              backgroundColor:
                theme.colors.surface,
              borderColor:
                theme.colors.danger,
            },
          ]}
        >

          {/* Sign out */}
          <SettingsRow
            icon={
              <LogOut
                size={25}
                color={theme.colors.primary}
                strokeWidth={1.8}
              />
            }
            title="Sign out"
            subtitle="Your archive stays on this device"
            onPress={signOut}
            disabled={submitting}
          />


          {/* Sign out everywhere */}
          <SettingsRow
            icon={
              <LogOut
                size={25}
                color={theme.colors.primary}
                strokeWidth={1.8}
              />
            }
            title="Sign out of all devices"
            subtitle="Ends every active session"
            onPress={signOutEverywhere}
            disabled={submitting}
          />


          {/* Delete account */}
          <SettingsRow
            icon={
              <Trash2
                size={25}
                color={theme.colors.danger}
                strokeWidth={1.8}
              />
            }
            title="Delete account"
            titleDanger
            subtitle="Erase your account and this device's archive"
            onPress={() => {
              setDeletePhrase('');
              setDeleteError(undefined);
              setDeleteVisible(true);
            }}
          />

        </View>


        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />

      </Stack>


      {/* =======================================================
          CHANGE EMAIL / PASSWORD
      ======================================================== */}

      <CredentialChangeModal
        kind={changeKind}
        email={user?.email ?? ''}
        onClose={() =>
          setChangeKind(undefined)
        }
        onEmailChanged={() =>
          dispatch(restoreSession())
        }
        onPasswordChanged={signOut}
      />


      <PinChangeModal
        visible={pinVisible}
        onClose={() => setPinVisible(false)}
        onChanged={() => Alert.alert('R-pin updated')}
      />


      <DeleteAccountModal
        visible={deleteVisible}
        phrase={deletePhrase}
        error={deleteError}
        onPhraseChange={setDeletePhrase}
        onClose={() => setDeleteVisible(false)}
        onSchedule={scheduleDeletion}
      />

    </Screen>
  );
}


/* =============================================================
   STYLES
============================================================= */

const styles = StyleSheet.create({

  container: {
    paddingTop: 20,
    paddingBottom: 40,
    gap: 0,
  },

  header: {
    minHeight: 38,
    marginBottom: 16,
  },

  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 0,
    marginLeft: 4,
    marginBottom: 8,
    marginTop: 6,
  },

  preferencesError: {
    marginHorizontal: 8,
    marginTop: -12,
    marginBottom: 12,
  },

  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },

  /* -----------------------------------------------------------
     PROFILE
  ----------------------------------------------------------- */

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2A303A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: '#D9B75F',
  },

  profileContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },

  profileName: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },

  profileDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#27324A',
    marginVertical: 8,
  },

  profileEmail: {
    fontSize: 13,
    lineHeight: 20,
  },

  /* -----------------------------------------------------------
     SETTINGS ROW
  ----------------------------------------------------------- */

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  settingsRowContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  rowTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },

  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  /* -----------------------------------------------------------
     PREFERENCES
  ----------------------------------------------------------- */

  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  preferenceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#162F3D',
    marginRight: 12,
  },

  preferenceContent: {
    flex: 1,
    minWidth: 0,
  },

  currencyButton: {
    minWidth: 82,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1B2740',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },

  currencyText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },

  appearanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  appearanceControl: {
    height: 38,
    width: 140,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  appearanceOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  appearanceOptionActive: {
    backgroundColor: '#35A7A0',
  },

  appearanceText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#8A97AE',
  },

  appearanceTextActive: {
    color: '#07111E',
  },

  preferenceDivider: {
    height: 1,
    width: '100%',
  },

  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  /* -----------------------------------------------------------
     SUPPORT
  ----------------------------------------------------------- */

  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  versionText: {
    fontSize: 13,
    lineHeight: 20,
  },

  /* -----------------------------------------------------------
     DANGER
  ----------------------------------------------------------- */

  dangerCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 24,
  },

  bottomSpacing: {
    height: 30,
  },

});