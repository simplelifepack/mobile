import { ErrorState } from '../../components/feedback/ErrorState';
import { useConnectivity } from '../../network/connectivity';
import type { Issue } from '../../components/feedback/issue';
import { DataLoadingBoundary } from '../../components/feedback/DataLoadingBoundary';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ModuleActions, type ModuleAction } from './ModuleActions';
import { useAppSelector } from '../../app/store/hooks';
import { DialogHeader } from './DialogHeader';
import { useNavigation, NavigationContext } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { PrimaryNavigation } from '../../components/navigation/TabBar';
import styled from 'styled-components/native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { PageContent } from '../../components/primitives/Layout';
import React from 'react';
import { Alert } from 'react-native';
import { AppModal as Modal } from '../../components/primitives/AppModal';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { TextInput } from '../../components/primitives/TextInput';
import {
  ModalSurface,
  ModalOptions,
  ModalPanel,
} from '../../components/primitives/Layout';
export { Stack, AppText, Button, TextInput };
export { useResource, useAction } from './resourceHooks';
const PageScroll = styled.ScrollView.attrs({
  automaticallyAdjustKeyboardInsets: true,
  keyboardShouldPersistTaps: 'handled' as const,
  keyboardDismissMode: 'interactive' as const,
})(({ theme }) => ({ flex: 1, paddingHorizontal: theme.spacing.md }));
const FeatureContent = styled(PageContent)<{ $navigation: boolean }>(
  ({ theme, $navigation }) => ({
    paddingBottom: $navigation
      ? theme.sizes.navigationClearance
      : theme.spacing.lg,
  }),
);
export function FeaturePage({
  title,
  children,
  description,
  subtitle,
  actions,
  actionFooter,
  actionTitle,
  actionSubtitle,
  onActionPress,
  loading,
  refreshing,
}: React.PropsWithChildren<{
  title: string;
  loading?: boolean;
  refreshing?: boolean;
  description?: string;
  subtitle?: string;
  actions?: ModuleAction[];
  actionFooter?: React.ReactNode;
  actionTitle?: string;
  actionSubtitle?: string;
  onActionPress?: () => void;
}>) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const authenticated = useAppSelector(
    state =>
      state.auth.status === 'authenticated' &&
      state.auth.user?.pinConfigured === true,
  );
  const showNavigation =
    authenticated && String(navigation.getState().type) !== 'tab';
  return (
    <Screen padded={false} bottomInset={false}>
      {authenticated ? <AppHeader title={title} subtitle={subtitle} /> : null}
      <PageScroll>
        <FeatureContent $navigation={authenticated}>
          {!authenticated || description ? (
            <Stack gap="sm">
              {!authenticated ? (
                <AppText variant="overviewTitle">{title}</AppText>
              ) : null}
              {description ? (
                <AppText color="muted">{description}</AppText>
              ) : null}
            </Stack>
          ) : null}
          {loading !== undefined ? (
            <DataLoadingBoundary
              page
              loading={loading}
              refreshing={refreshing}
              loadingLabel={`Loading ${title.toLowerCase()}…`}
              refreshingLabel={`Refreshing ${title.toLowerCase()}…`}
            >
              {children}
            </DataLoadingBoundary>
          ) : (
            children
          )}
        </FeatureContent>
      </PageScroll>
      {showNavigation ? (
        <PrimaryNavigation
          active={
            (
              { Packages: 'Readiness', DocumentLibrary: 'Documents' } as Record<
                string,
                string
              >
            )[navigation.getState().routes[navigation.getState().index].name] ??
            navigation.getState().routes[navigation.getState().index].name
          }
          onSelect={screen => navigation.popTo('Main', { screen })}
        />
      ) : null}
      {authenticated && (actions?.length || onActionPress) ? (
        <ModuleActions
          title={title}
          actions={actions ?? []}
          sheetTitle={actionTitle}
          subtitle={actionSubtitle}
          onTrigger={onActionPress}
          footer={actionFooter}
        />
      ) : null}
    </Screen>
  );
}
export function ResourceStatus({
  resource,
  showLoading = true,
}: {
  resource: {
    loading: boolean;
    error: string;
    refresh: () => void;
    data?: unknown;
    issue?: Issue;
  };
  showLoading?: boolean;
}) {
  const network = useConnectivity();
  const navigation = React.useContext(NavigationContext);
  if (network.offline) return null;
  if (resource.loading)
    return showLoading ? (
      <LoadingState
        compact
        label={
          resource.data !== undefined
            ? 'Refreshing loaded content…'
            : 'Loading records…'
        }
      />
    ) : null;
  return resource.error ? (
    <ErrorState
      error={resource.error}
      issue={resource.issue}
      onRetry={resource.refresh}
      onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
    />
  ) : null;
}
export function confirmAction(
  title: string,
  action: () => void,
  message = 'This action removes this item from your account.',
) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', style: 'destructive', onPress: action },
  ]);
}
export function Choice({
  label,
  value,
  options,
  onChange,
  error,
  disabled,
}: {
  error?: string;
  disabled?: boolean;
  label: string;
  value: string;
  options: Array<string | { label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [optionQuery, setOptionQuery] = React.useState('');
  const normalized = options.map(option =>
    typeof option === 'string'
      ? {
          label: /^[A-Z_]{4,}$/.test(option)
            ? option
                .toLowerCase()
                .replace(/_/g, ' ')
                .replace(/^./, char => char.toUpperCase())
            : option.replace(/_/g, ' '),
          value: option,
        }
      : option,
  );
  return (
    <Stack gap="xs">
      <AppText variant="label">{label}</AppText>
      <Button
        title={
          normalized.find(item => item.value === value)?.label ??
          (value || 'Choose…')
        }
        variant="secondary"
        disabled={disabled}
        onPress={() => {
          setOptionQuery('');
          setOpen(true);
        }}
      />
      {error ? (
        <AppText color="danger" variant="caption" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <ModalSurface>
          <ModalPanel>
            <DialogHeader title={label} onClose={() => setOpen(false)} />
            {normalized.length > 8 ? (
              <TextInput
                label={`Search ${label.toLowerCase()}`}
                value={optionQuery}
                onChangeText={setOptionQuery}
                autoCapitalize="none"
              />
            ) : null}
            <ModalOptions>
              {normalized
                .filter(option =>
                  `${option.label} ${option.value}`
                    .toLowerCase()
                    .includes(optionQuery.toLowerCase()),
                )
                .map(option => (
                  <Button
                    key={option.value}
                    title={`${value === option.value ? '✓ ' : ''}${option.label}`}
                    variant="ghost"
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  />
                ))}
            </ModalOptions>
            <Button title="Close" onPress={() => setOpen(false)} />
          </ModalPanel>
        </ModalSurface>
      </Modal>
    </Stack>
  );
}
export function Details({ value }: { value: unknown }) {
  if (value == null) return null;
  if (Array.isArray(value))
    return (
      <Stack gap="xs">
        {value.map((item, index) => (
          <Details key={index} value={item} />
        ))}
      </Stack>
    );
  if (typeof value === 'object')
    return (
      <Stack gap="xs">
        {Object.entries(value)
          .filter(
            ([key, item]) =>
              item != null &&
              ![
                'id',
                'memberId',
                'documentId',
                'recordId',
                'ownerProfileId',
                'rawText',
                'path',
                'storedName',
              ].includes(key),
          )
          .map(([key, item]) => (
            <Stack key={key} gap="xs">
              <AppText variant="caption" color="muted">
                {key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/_/g, ' ')
                  .trim()
                  .replace(/^./, char => char.toUpperCase())}
              </AppText>
              <Details value={item} />
            </Stack>
          ))}
      </Stack>
    );
  return (
    <AppText>
      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
    </AppText>
  );
}
export function isDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
