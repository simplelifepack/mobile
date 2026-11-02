import React, { useEffect, useState } from 'react';
import { Alert, Platform, Share, StyleSheet, View } from 'react-native';
import { Download } from 'lucide-react-native';
import { FileSystem } from 'react-native-file-access';

import { accountApi, type AccountUsage } from '../../api/account.api';
import { AppText } from '../../components/primitives/AppText';
import { Row } from '../../components/primitives/Row';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { SectionTitle, SettingsCard, SettingsRow } from './SettingsPrimitives';
import { fontSize, fontWeights} from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';

export function AccountDataSection() {
  const { theme } = useAppTheme();
  const [usage, setUsage] = useState<AccountUsage>();
  const [usageError, setUsageError] = useState<string>();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    accountApi
      .usage()
      .then(value => {
        if (active) setUsage(value);
      })
      .catch(error => {
        if (active) {
          setUsageError(
            error instanceof Error
              ? error.message
              : 'Unable to load account usage.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const prepareExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const job = await accountApi.requestExport();
      let latest = job;
      for (
        let attempt = 0;
        attempt < 20 && latest.status !== 'READY' && latest.status !== 'FAILED';
        attempt += 1
      ) {
        await new Promise<void>(resolve => setTimeout(resolve, 1500));
        latest = await accountApi.exportStatus(job.id);
      }

      if (latest.status === 'FAILED') {
        throw new Error(latest.errorMessage || 'Export failed.');
      }
      if (latest.status !== 'READY') {
        Alert.alert(
          'Export is still preparing',
          'Return to Settings and try again in a moment.',
        );
        return;
      }

      const file = await accountApi.downloadExport(job.id);
      if (Platform.OS === 'android') {
        await FileSystem.cpExternal(file.path, file.fileName, 'downloads');
        Alert.alert('Export ready', `Saved to Downloads/${file.fileName}.`);
      } else {
        await Share.share({
          title: file.fileName,
          url: file.path.startsWith('file://') ? file.path : `file://${file.path}`,
        });
      }
    } catch (error) {
      Alert.alert(
        'Unable to export account data',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setExporting(false);
    }
  };

  const storageUsedMb = usage
    ? (usage.storage.usedBytes / (1024 * 1024)).toFixed(1)
    : undefined;
  const storageLimitMb = usage?.storage.limitBytes
    ? (usage.storage.limitBytes / (1024 * 1024)).toFixed(0)
    : undefined;
  const storagePercent = usage?.storage.limitBytes
    ? Math.min(100, (usage.storage.usedBytes / usage.storage.limitBytes) * 100)
    : 0;

  return (
    <>
      <SectionTitle title="USAGE" />
      <SettingsCard>
        <View style={styles.usageContent}>
          <Row align="center" justify="space-between">
            <AppText style={styles.usageTitle}>Cloud storage</AppText>
            <AppText variant="label" color="secondary">
              {usage
                ? usage.storage.unlimited
                  ? `${storageUsedMb} MB used · Unlimited`
                  : `${storageUsedMb} of ${storageLimitMb} MB`
                : usageError
                  ? 'Unavailable'
                  : 'Loading…'}
            </AppText>
          </Row>
          <View
            style={[
              styles.usageTrack,
              { backgroundColor: theme.colors.surface.raised },
            ]}
          >
            <View
              style={[
                styles.usageFill,
                {
                  width: `${usage?.storage.unlimited ? 100 : storagePercent}%`,
                  backgroundColor: theme.colors.action.primary.default,
                },
              ]}
            />
          </View>
          <Row align="center" justify="space-between">
            <AppText variant="caption" color="secondary">
              {usage?.accountTier === 'paid' ? 'Paid account' : 'Free account'}
            </AppText>
            <AppText variant="caption" color="secondary">
              {usage
                ? usage.aiUsage.unlimited
                  ? 'Unlimited AI actions'
                  : `${usage.aiUsage.used} of ${usage.aiUsage.limit} AI actions this month`
                : 'AI usage unavailable'}
            </AppText>
          </Row>
          {usageError ? (
            <AppText variant="caption" color="danger">
              {usageError}
            </AppText>
          ) : null}
        </View>
      </SettingsCard>

      <SectionTitle title="ACCOUNT DATA" />
      <SettingsCard>
        <SettingsRow
          icon={<Download size={sizes.icon.md} color={theme.colors.text.interactive} />}
          title={exporting ? 'Preparing export…' : 'Export all data'}
          subtitle="Prepare a ZIP containing your account data and uploaded files."
          onPress={() => Alert.alert(
            'Export all data?',
            'Readiness will prepare a ZIP file. This can take a little while.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Prepare ZIP', onPress: prepareExport },
            ],
          )}
          disabled={exporting}
        />
      </SettingsCard>
    </>
  );
}

const styles = StyleSheet.create({
  usageContent: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  usageTitle: {
    fontSize: fontSize.bodySm,
    fontWeight: fontWeights.semibold,
  },
  usageTrack: {
    height: 7,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});