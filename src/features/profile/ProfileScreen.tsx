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
import { fontSize, lineHeight } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';

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
              color={theme.colors.text.primary}
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
            <View style={[styles.avatar, { backgroundColor: theme.colors.surface.brandTint }]}>
              <AppText style={[styles.avatarText, { color: theme.colors.text.interactive }]}>
                {(user?.name?.charAt(0) ?? 'R').toUpperCase()}
              </AppText>
            </View>

            <View style={styles.profileContent}>
              <AppText style={styles.profileName}>
                {user?.name ?? 'Ravi'}
              </AppText>

              <View style={[styles.profileDivider, { backgroundColor: theme.colors.border.subtle }]} />

              <AppText
                style={styles.profileEmail}
                color="secondary"
              >
                {user?.email ?? 'dev@readines.app'}
              </AppText>
            </View>
          </View>


          {/* Change email */}
          <SettingsRow
            icon={
              <Mail
                size={25}
                color={theme.colors.text.interactive}
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
                color={theme.colors.text.interactive}
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
                color={theme.colors.text.interactive}
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
                color={theme.colors.text.interactive}
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
                  color={theme.colors.text.secondary}
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
                color={theme.colors.text.interactive}
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
                color={theme.colors.text.interactive}
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
                color={theme.colors.text.interactive}
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
                color={theme.colors.text.interactive}
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
                theme.colors.surface.default,
              borderColor:
                theme.colors.status.danger.border,
            },
          ]}
        >

          {/* Sign out */}
          <SettingsRow
            icon={
              <LogOut
                size={25}
                color={theme.colors.text.interactive}
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
                color={theme.colors.text.interactive}
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
                color={theme.colors.status.danger.text}
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
    fontSize: fontSize.headingLg,
    lineHeight: lineHeight.headingLg,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
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
    borderRadius: radius.surface,
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
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    fontSize: fontSize.headingXl,
    lineHeight: lineHeight.headingXl,
    fontWeight: '700',
  },

  profileContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },

  profileName: {
    fontSize: fontSize.headingSm,
    lineHeight: lineHeight.headingSm,
    fontWeight: '700',
  },

  profileDivider: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },

  profileEmail: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
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
    borderRadius: radius.surface,
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
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: '700',
  },

  rowSubtitle: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
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


  preferenceContent: {
    flex: 1,
    minWidth: 0,
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
    borderRadius: radius.surface,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  appearanceOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },

  /* -----------------------------------------------------------
     DANGER
  ----------------------------------------------------------- */

  dangerCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.overlay,
    overflow: 'hidden',
    marginBottom: 24,
  },

  bottomSpacing: {
    height: 30,
  },

});