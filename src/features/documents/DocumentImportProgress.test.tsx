import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { DocumentImportProgress } from './DocumentImportProgress';

it('shows actual progress and stops accepting cancellation after it is requested', async () => {
  const cancel = jest.fn();
  const screen = (cancelled: boolean) => <AppThemeProvider><DocumentImportProgress total={3} completed={1} saved={1}
    currentName="report.pdf" cancelled={cancelled} onCancel={cancel} /></AppThemeProvider>;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => { renderer = ReactTestRenderer.create(screen(false)); });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('report.pdf');
  expect(renderer.root.findByProps({ accessibilityLabel: 'Document import progress' }).props.accessibilityValue).toEqual({ min: 0, max: 3, now: 1 });
  expect(StyleSheet.flatten(renderer.root.findByProps({ testID: 'completed-progress' }).props.style).width).toBe('33%');
  expect(StyleSheet.flatten(renderer.root.findByProps({ testID: 'active-progress-track' }).props.style).width).toBe('67%');
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Processing document… · 33% of batch completed');
  await act(async () => { renderer.root.findByType(Button).props.onPress(); });
  expect(cancel).toHaveBeenCalledTimes(1);
  await act(async () => { renderer.update(screen(true)); });
  expect(renderer.root.findByType(Button).props.disabled).toBe(true);
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Finishing the current document, then stopping.');
  await act(async () => { renderer.unmount(); });
});

it('shows animated activity even when the first or only document is processing', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><DocumentImportProgress total={1} completed={0} saved={0}
      currentName="report.pdf" cancelled={false} onCancel={jest.fn()} /></AppThemeProvider>);
  });
  expect(StyleSheet.flatten(renderer.root.findByProps({ testID: 'completed-progress' }).props.style).width).toBe('0%');
  expect(StyleSheet.flatten(renderer.root.findByProps({ testID: 'active-progress-track' }).props.style).width).toBe('100%');
  expect(renderer.root.findByProps({ testID: 'active-progress' })).toBeTruthy();
  await act(async () => { renderer.unmount(); });
});
