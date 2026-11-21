import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { KeyboardAvoidingView, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { FormSheet } from '../../features/health/components/HealthForms';
import { GlobalSearchModal } from '../../features/home/GlobalSearchModal';
import { ActionSheet } from './ActionSheet';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 59, bottom: 34, left: 10, right: 12 },
};

const wrap = (children: React.ReactNode) => (
  <SafeAreaProvider initialMetrics={metrics}><AppThemeProvider>{children}</AppThemeProvider></SafeAreaProvider>
);

it('keeps action sheets inside the safe area and scrolls long option lists', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(wrap(<ActionSheet visible title="Options" onClose={jest.fn()}
      options={Array.from({ length: 20 }, (_, i) => ({ label: `Option ${i}`, onPress: jest.fn() }))} />));
  });
  const modal = renderer.root.findByType(Modal);
  expect(modal.props.navigationBarTranslucent).toBe(true);
  const views = renderer.root.findAllByType(View).map(item => StyleSheet.flatten(item.props.style) ?? {});
  expect(views.some(style => style.paddingTop === 59 && style.paddingLeft === 10 && style.paddingRight === 12)).toBe(true);
  expect(views.some(style => style.paddingBottom === 42 && style.maxHeight === '100%')).toBe(true);
  expect(renderer.root.findAllByType(ScrollView).length).toBeGreaterThan(0);
});

it('renders embedded action sheets without a nested modal and keeps options interactive', async () => {
  const onSelect = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(wrap(
      <View>
        <ActionSheet
          embedded
          visible
          title="Choose owner"
          onClose={jest.fn()}
          options={[{ label: 'Me', onPress: onSelect }]}
        />
      </View>,
    ));
  });

  expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
  const option = renderer.root.findByProps({ accessibilityLabel: 'Me' });
  await act(async () => option.props.onPress());
  expect(onSelect).toHaveBeenCalledTimes(1);
});

it('keeps health form sheets clear of system bars', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(wrap(<FormSheet title="Test" onClose={jest.fn()}><View /></FormSheet>));
  });
  const rootStyle = StyleSheet.flatten(renderer.root.findByType(KeyboardAvoidingView).props.style);
  expect(rootStyle).toEqual(expect.objectContaining({ paddingTop: 59, paddingLeft: 10, paddingRight: 12 }));
  const views = renderer.root.findAllByType(View).map(item => StyleSheet.flatten(item.props.style) ?? {});
  expect(views.some(style => style.paddingBottom === 42)).toBe(true);
});

it('uses a safe-area container instead of a fixed status bar offset in global search', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(wrap(<GlobalSearchModal visible onClose={jest.fn()} onOpenResult={jest.fn()} />));
  });
  expect(renderer.root.findAllByType(SafeAreaView).length).toBeGreaterThan(0);
});
