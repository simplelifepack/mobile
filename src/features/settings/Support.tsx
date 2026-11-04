import React from 'react';
import { SettingsSection, SettingsRow } from './SettingsUI';
import { Sparkles, HelpCircle, MessageSquare, Info } from 'lucide-react-native';
import { AppText, Stack } from '../shared/FeatureUI';
import { DetailSheet } from '../shared/DetailSheet';
const help = {
  "What's new": [
    [
      'Document archive',
      'Find your files in Documents, preview them and download copies.',
    ],
    [
      'Health readiness',
      'Keep health profiles, measurements and visit records together.',
    ],
  ],
  'Help and FAQs': [
    [
      'Where are my documents stored?',
      'Your documents are stored in your Readines cloud archive and protected by your account.',
    ],
    [
      'Can I export my data?',
      'Use Export all data in Settings to prepare a ZIP with your Readines data and uploaded files.',
    ],
    [
      'How do I reset my password?',
      'Choose “Forgot password?” on the sign-in screen to reset your password by email.',
    ],
  ],
  'Send feedback': [
    [
      'Feedback',
      'Email support@readiness.com to report an issue or suggest an improvement.',
    ],
  ],
  'About Readines': [
    [
      'Readines',
      'Readines keeps your family ready for important moments by organizing documents, readiness packs, health context, wealth records, and trusted access in one private account.',
    ],
  ],
};
export function Support() {
  const [open, setOpen] = React.useState<keyof typeof help>();
  return (
    <SettingsSection title="Support">
      {(Object.keys(help) as Array<keyof typeof help>).map(title => (
        <SettingsRow
          key={title}
          label={title}
          Icon={
            title === "What's new"
              ? Sparkles
              : title === 'Help and FAQs'
                ? HelpCircle
                : title === 'Send feedback'
                  ? MessageSquare
                  : Info
          }
          onPress={() => setOpen(title)}
        />
      ))}
      {open ? (
        <DetailSheet title={open} onClose={() => setOpen(undefined)}>
          {help[open].map(([title, body]) => (
            <Stack key={title} gap="sm">
              <AppText variant="label">{title}</AppText>
              <AppText color="muted">{body}</AppText>
            </Stack>
          ))}
        </DetailSheet>
      ) : null}
    </SettingsSection>
  );
}
