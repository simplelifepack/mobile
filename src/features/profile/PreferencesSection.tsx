import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Bell, ChevronDown, Coins, Moon } from 'lucide-react-native';

import { preferencesApi, type UserPreferences } from '../../api/preferences.api';
import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { CurrencyPickerModal } from './ProfileDialogs';
import { SectionTitle, SettingsCard } from './SettingsPrimitives';

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD'];

export function PreferencesSection() {
  const { theme, mode, setMode } = useAppTheme();
  const [preferences, setPreferences] = useState<UserPreferences>();
  const [error, setError] = useState<string>();
  const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    preferencesApi
      .get()
      .then(value => {
        if (!active) return;
        setPreferences(value);
        setMode(value.appearance);
      })
      .catch(loadError => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load preferences.',
        );
      });
    return () => {
      active = false;
    };
  }, [setMode]);

  const updatePreferences = async (patch: Partial<UserPreferences>) => {
    if (!preferences) return;
    setError(undefined);
    try {
      const updated = await preferencesApi.update(patch);
      setPreferences(updated);
      if (patch.appearance) setMode(patch.appearance);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Unable to update preferences.',
      );
    }
  };

  const selectCurrency = async (homeCurrency: string) => {
    setCurrencyPickerVisible(false);
    await updatePreferences({ homeCurrency });
  };

  return (
    <>
      <SectionTitle title="PREFERENCES" />
      <SettingsCard>
        <Pressable
          accessibilityRole="button"
          disabled={!preferences}
          onPress={() => setCurrencyPickerVisible(true)}
          style={[styles.row, !preferences && styles.disabledRow]}
        >
          <View style={styles.icon}>
            <Coins size={22} color={theme.colors.primary} strokeWidth={1.8} />
          </View>
          <View style={styles.content}>
            <AppText style={styles.rowTitle}>Home currency</AppText>
            <AppText style={styles.rowSubtitle} color="secondary">
              Indicative rate, bundled with the app
            </AppText>
          </View>
          <View style={[styles.currencyButton, { backgroundColor: theme.colors.surfaceElevated }]}>
            <AppText style={styles.currencyText}>
              {preferences?.homeCurrency ?? '…'}
            </AppText>
            <ChevronDown size={18} color={theme.colors.textPrimary} />
          </View>
        </Pressable>

        <View style={styles.row}>
          <View style={styles.icon}>
            <Moon size={22} color={theme.colors.primary} strokeWidth={1.8} />
          </View>
          <View style={styles.content}>
            <AppText style={styles.rowTitle}>Appearance</AppText>
          </View>
          <View
            style={[
              styles.appearanceControl,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
              },
            ]}
          >
            {(['dark', 'light'] as const).map(appearance => {
              const selected = mode === appearance;
              return (
                <Pressable
                  key={appearance}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => updatePreferences({ appearance })}
                  style={[
                    styles.appearanceOption,
                    selected && { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <AppText
                    style={[
                      styles.appearanceText,
                      selected && { color: theme.colors.onPrimary },
                    ]}
                  >
                    {appearance === 'dark' ? 'Dark' : 'Light'}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.row}>
          <View style={styles.icon}>
            <Bell size={22} color={theme.colors.textSecondary} strokeWidth={1.8} />
          </View>
          <View style={styles.content}>
            <AppText style={styles.rowTitle}>Notifications</AppText>
            <AppText style={styles.rowSubtitle} color="secondary">
              Reminder alerts on this device
            </AppText>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{
              false: theme.colors.surfaceElevated,
              true: theme.colors.primary,
            }}
            thumbColor={notificationsEnabled ? '#FFFFFF' : theme.colors.textSecondary}
            ios_backgroundColor={theme.colors.surfaceElevated}
          />
        </View>

        {error ? (
          <AppText variant="caption" color="danger" style={styles.error}>
            {error}
          </AppText>
        ) : null}
      </SettingsCard>

      <CurrencyPickerModal
        visible={currencyPickerVisible}
        currency={preferences?.homeCurrency}
        currencies={currencies}
        onSelect={selectCurrency}
        onClose={() => setCurrencyPickerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disabledRow: {
    opacity: 0.6,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  currencyButton: {
    minWidth: 78,
    height: 38,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  currencyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  appearanceControl: {
    height: 36,
    width: 132,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  appearanceOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearanceText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: '#8A97AE',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  error: {
    margin: 12,
  },
});