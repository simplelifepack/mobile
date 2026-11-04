import type { ThemeMode } from '../../design/theme/types';
import { PinChange } from './PinChange';
import { AppLockSettings } from './AppLockSettings';
import {
  Users,
  Globe,
  BookOpen,
  Coins,
  Moon,
  Bell,
  Brain,
  CreditCard,
  RefreshCw,
  HardDrive,
  Sparkles,
  LogOut,
} from 'lucide-react-native';
import { AccountChange } from './AccountChange';
import { AccountExport } from './AccountExport';
import { DeleteAccount } from './DeleteAccount';
import {
  SettingsSection,
  SettingsRow,
  SettingsContent,
  AccountAvatar,
  AccountSummary,
  AccountCopy,
} from './SettingsUI';
import { Progress } from '../../components/primitives/Progress';
import { Support } from './Support';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { SectionTabs } from '../shared/SectionTabs';
import {
  countryOptions,
  currencyOptions,
  optionLabel,
} from './preferenceOptions';
import React from 'react';
import { Toggle as Switch } from '../../components/primitives/Toggle';
import { preferencesApi } from '../../api/preferences.api';
import { mobileApi } from '../../api/mobile.api';
import { billingApi } from '../../api/billing.api';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { logout } from '../auth/authSlice';
import { api } from '../../services/api';
import {
  FeaturePage,
  AppText,
  ResourceStatus,
  useResource,
  useAction,
  confirmAction,
} from '../shared/FeatureUI';
import { ActiveForm, type FormConfig } from '../shared/RecordForm';
export function SettingsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const preferences = useResource(preferencesApi.get);
  const usage = useResource(mobileApi.usage);
  const billing = useResource(billingApi.status);
  const { setMode } = useAppTheme();
  const dispatch = useAppDispatch();
  const action = useAction();
  const [form, setForm] = React.useState<FormConfig | null>(null);
  React.useEffect(() => {
    if (preferences.data) setMode(preferences.data.appearance);
  }, [preferences.data, setMode]);
  const openRegional = () =>
    setForm({
      title: 'Regional preferences',
      fields: [
        {
          key: 'country',
          label: 'Country',
          options: [
            { label: 'Not set', value: '' },
            ...countryOptions.map(option => ({
              label: optionLabel(option),
              value: option.code,
            })),
          ],
          initial: preferences.data?.country ?? '',
        },
        {
          key: 'passportCountry',
          label: 'Passport country',
          options: [
            { label: 'Not set', value: '' },
            ...countryOptions.map(option => ({
              label: optionLabel(option),
              value: option.code,
            })),
          ],
          initial: preferences.data?.passportCountry ?? '',
        },
        {
          key: 'homeCurrency',
          label: 'Home currency',
          options: currencyOptions.map(option => ({
            label: option.label,
            value: option.code,
          })),
          initial: preferences.data?.homeCurrency ?? 'INR',
        },
      ],
      submit: async values => {
        if (values.homeCurrency && !/^[A-Z]{3}$/.test(values.homeCurrency))
          throw new Error('Use a three-letter currency code.');
        await preferencesApi.update({
          country: values.country || null,
          passportCountry: values.passportCountry || null,
          homeCurrency: values.homeCurrency || null,
        });
        preferences.refresh();
      },
    });
  const user = useAppSelector(state => state.auth.user);
  const saveAi = (enabled: boolean) => {
    void action.run(async () => {
      await preferencesApi.update({ aiProcessingEnabled: enabled });
      preferences.refresh();
    });
  };
  const subscription = billing.data?.subscription;
  const renewalOff = Boolean(
    subscription?.cancelAtCycleEnd ||
    ['cancelled', 'expired', 'completed', 'creation_failed'].includes(
      subscription?.status ?? '',
    ),
  );
  const cancellable = Boolean(subscription && !renewalOff);
  const formatDate = (date: string | null | undefined) =>
    date && Number.isFinite(Date.parse(date))
      ? new Date(date).toLocaleDateString()
      : 'Not available';
  return (
    <FeaturePage title="Settings" subtitle="Security, preferences and access">
      <SettingsSection title="Account">
        <AccountSummary>
          <AccountAvatar>
            <AppText variant="heading" color="accent">
              {user?.name?.trim().charAt(0).toUpperCase() || 'A'}
            </AppText>
          </AccountAvatar>
          <AccountCopy>
            <AppText variant="heading">{user?.name || 'Your account'}</AppText>
            <AppText variant="caption" color="muted">
              {user?.email}
            </AppText>
          </AccountCopy>
        </AccountSummary>
        <SettingsRow
          Icon={Users}
          label="Family and access"
          description="Trusted people, permissions and emergency contacts"
          onPress={() => navigation.navigate('Family')}
        />
        {user?.email.toLowerCase() === 'admin@readines.com' ? (
          <SettingsRow
            Icon={BookOpen}
            label="Package administration"
            onPress={() => navigation.navigate('PackageAdmin')}
          />
        ) : null}
        <AccountChange kind="email" />
        <AccountChange kind="password" />
        <PinChange />
      </SettingsSection>
      <AppLockSettings />
      <SettingsSection title="Preferences">
        {preferences.loading || preferences.error ? (
          <SettingsContent>
            <ResourceStatus resource={preferences} />
          </SettingsContent>
        ) : null}
        {preferences.data ? (
          <>
            <SettingsRow
              Icon={Globe}
              label="Country"
              description="Where you prepare documents and requirements"
              value={
                countryOptions.find(
                  option => option.code === preferences.data?.country,
                )?.label ||
                preferences.data.country ||
                'Not set'
              }
              disabled={action.busy}
              onPress={openRegional}
            />
            <SettingsRow
              Icon={BookOpen}
              label="Passport country"
              value={
                countryOptions.find(
                  option => option.code === preferences.data?.passportCountry,
                )?.label ||
                preferences.data.passportCountry ||
                'Not set'
              }
              disabled={action.busy}
              onPress={openRegional}
            />
            <SettingsRow
              Icon={Coins}
              label="Home currency"
              value={preferences.data.homeCurrency || 'Not set'}
              disabled={action.busy}
              onPress={openRegional}
            />
            <SettingsRow
              Icon={Moon}
              label="Appearance"
              description="Choose your preferred theme"
            />
            <SettingsContent>
              <SectionTabs
                label="Appearance"
                disabled={action.busy || preferences.loading}
                value={preferences.data.appearance}
                options={[
                  { value: 'system', label: 'System' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
                onChange={value => {
                  void action.run(async () => {
                    await preferencesApi.update({
                      appearance: value as ThemeMode,
                    });
                    setMode(value as ThemeMode);
                    preferences.refresh();
                  });
                }}
              />
            </SettingsContent>
            <SettingsRow
              Icon={Bell}
              label="Notifications"
              value="Unavailable"
              description="Device alerts aren’t available in this build. View reminders from Home or Health."
            />
            <SettingsRow
              Icon={Brain}
              label="AI processing"
              description="Extract, classify and analyze your information"
              trailing={
                <Switch
                  accessibilityLabel="AI document processing"
                  disabled={action.busy || preferences.loading}
                  value={preferences.data.aiProcessingEnabled}
                  onValueChange={saveAi}
                />
              }
            />
          </>
        ) : null}
      </SettingsSection>
      <SettingsSection title="Billing">
        {billing.loading || billing.error ? (
          <SettingsContent>
            <ResourceStatus resource={billing} />
          </SettingsContent>
        ) : null}
        <SettingsRow
          Icon={CreditCard}
          label={
            billing.data?.accountTier === 'paid'
              ? 'Full plan'
              : billing.data
                ? 'Free account'
                : 'Loading plan…'
          }
          description={
            billing.data?.legacyPaid
              ? 'Your existing paid access is active. No new subscription is needed.'
              : subscription
                ? `${subscription.plan === 'annual' ? 'Annual' : 'Monthly'} · ${subscription.status}`
                : 'Your current account access'
          }
        />
        {subscription ? (
          <>
            <SettingsRow
              label="Paid access until"
              value={formatDate(
                subscription.paidThrough || subscription.periodEnd,
              )}
            />
            <SettingsRow
              label="Automatic renewal"
              value={renewalOff ? 'Off' : 'On'}
              description={
                renewalOff
                  ? 'Access continues through your verified paid period.'
                  : subscription.nextChargeAt
                    ? `Next charge ${formatDate(subscription.nextChargeAt)}`
                    : 'Renews automatically unless cancelled.'
              }
            />
            {cancellable ? (
              <SettingsRow
                label="Cancel renewal"
                danger
                disabled={action.busy}
                onPress={() =>
                  confirmAction(
                    'Cancel subscription renewal?',
                    () => {
                      void action.run(async () => {
                        await billingApi.cancel();
                        billing.refresh();
                        usage.refresh();
                      });
                    },
                    'Paid access continues until the end of the verified paid period.',
                  )
                }
              />
            ) : null}
          </>
        ) : null}
        <SettingsRow
          Icon={RefreshCw}
          label="Refresh billing status"
          disabled={billing.loading || usage.loading}
          onPress={() => {
            billing.refresh();
            usage.refresh();
          }}
        />
        <SettingsContent>
          <AppText variant="caption" color="muted">
            New subscription purchases are not available in this app yet.
          </AppText>
        </SettingsContent>
      </SettingsSection>
      <SettingsSection title="Storage and usage">
        {usage.loading || usage.error ? (
          <SettingsContent>
            <ResourceStatus resource={usage} />
          </SettingsContent>
        ) : null}
        {usage.data ? (
          <>
            <SettingsRow
              Icon={HardDrive}
              label="Cloud storage"
              value={`${(usage.data.storage.usedBytes / 1048576).toFixed(1)} MB`}
              description={
                usage.data.storage.unlimited
                  ? 'Unlimited storage'
                  : `${((usage.data.storage.limitBytes ?? 0) / 1048576).toFixed(0)} MB available on your plan`
              }
            />
            {!usage.data.storage.unlimited && usage.data.storage.limitBytes ? (
              <SettingsContent>
                <Progress
                  value={
                    (usage.data.storage.usedBytes /
                      usage.data.storage.limitBytes) *
                    100
                  }
                  label="Cloud storage used"
                />
              </SettingsContent>
            ) : null}
            <SettingsRow
              Icon={Sparkles}
              label="AI package searches"
              value={
                usage.data.aiUsage.unlimited
                  ? 'Unlimited'
                  : `${usage.data.aiUsage.used ?? 0} / ${usage.data.aiUsage.limit ?? 0}`
              }
              description={`Usage period: ${usage.data.aiUsage.period}`}
            />
          </>
        ) : null}
      </SettingsSection>
      <SettingsSection title="Account data">
        <AccountExport />
      </SettingsSection>
      <Support />
      <SettingsSection title="Session">
        <SettingsRow
          Icon={LogOut}
          label="Sign out"
          description="Your archive stays in your account"
          disabled={action.busy}
          onPress={() => {
            void action.run(async () => {
              await dispatch(logout());
              dispatch(api.util.resetApiState());
            });
          }}
        />
        <SettingsRow
          Icon={LogOut}
          label="Sign out all devices"
          disabled={action.busy}
          onPress={() =>
            confirmAction(
              'Sign out all devices?',
              () => {
                void action.run(async () => {
                  await mobileApi.auth.logoutAll();
                  await dispatch(logout());
                  dispatch(api.util.resetApiState());
                });
              },
              'You will need to sign in again on all devices.',
            )
          }
        />
      </SettingsSection>
      <SettingsSection title="Delete account">
        <DeleteAccount />
      </SettingsSection>
      {action.message ? <AppText>{action.message}</AppText> : null}
      <ActiveForm form={form} onClose={() => setForm(null)} />
    </FeaturePage>
  );
}
