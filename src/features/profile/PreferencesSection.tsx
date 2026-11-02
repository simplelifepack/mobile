import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Bell, ChevronDown, Coins, Moon } from 'lucide-react-native';

import { preferencesApi, type UserPreferences } from '../../api/preferences.api';
import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { CurrencyPickerModal } from './ProfileDialogs';
import { SectionTitle, SettingsCard } from './SettingsPrimitives';
import { fontSize, lineHeight } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';

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
            <Coins size={22} color={theme.colors.text.interactive} strokeWidth={1.8} />
          </View>
          <View style={styles.content}>
            <AppText style={styles.rowTitle}>Home currency</AppText>
            <AppText style={styles.rowSubtitle} color="secondary">
              Indicative rate, bundled with the app
            </AppText>
          </View>
          <View style={[styles.currencyButton, { backgroundColor: theme.colors.surface.raised }]}>
            <AppText style={styles.currencyText}>
              {preferences?.homeCurrency ?? '…'}
            </AppText>
            <ChevronDown size={18} color={theme.colors.text.primary} />
          </View>
        </Pressable>

        <View style={styles.row}>
          <View style={styles.icon}>
            <Moon size={22} color={theme.colors.text.interactive} strokeWidth={1.8} />
          </View>
          <View style={styles.content}>
            <AppText style={styles.rowTitle}>Appearance</AppText>
          </View>
          <View
            style={[
              styles.appearanceControl,
              {
                borderColor: theme.colors.border.default,
                backgroundColor: theme.colors.surface.canvas,
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
                    selected && { backgroundColor: theme.colors.action.primary.default },
                  ]}
                >
                  <AppText
                    style={[
                      styles.appearanceText,
                      { color: theme.colors.text.secondary },
                      selected && { color: theme.colors.text.onBrand },
                    ]}
                  >
                    {appearance === 'dark' ? 'Dark' : 'Light'}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border.default }]} />

        <View style={styles.row}>
          <View style={styles.icon}>
            <Bell size={22} color={theme.colors.text.secondary} strokeWidth={1.8} />
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
              false: theme.colors.surface.raised,
              true: theme.colors.text.interactive,
            }}
            thumbColor={notificationsEnabled ? theme.colors.text.onBrand : theme.colors.icon.secondary}
            ios_backgroundColor={theme.colors.surface.raised}
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
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    marginTop: 2,
  },
  currencyButton: {
    minWidth: 78,
    height: 38,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  currencyText: {
    fontSize: fontSize.bodySm,
    fontWeight: '600',
  },
  appearanceControl: {
    height: 36,
    width: 132,
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
  appearanceText: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  error: {
    margin: 12,
  },
});