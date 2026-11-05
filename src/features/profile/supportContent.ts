export type SupportTopic = 'whatsnew' | 'faq' | 'feedback' | 'privacy' | 'about';

export type SupportSection = { title: string; body: string };

export const SUPPORT_EMAIL = 'support@readiness.com';

export const SUPPORT_CONTENT: Record<
  SupportTopic,
  { title: string; sections: SupportSection[] }
> = {
  whatsnew: {
    title: "What's new",
    sections: [
      {
        title: 'Clearer typography',
        body: 'Lighter labels, consistent text sizes, and clearer headings across ReadiNes.',
      },
      {
        title: 'Consistent dropdowns',
        body: 'Filters and forms now share the same dropdown design. Searchable country and document-type pickers make longer lists easier to use, while custom entries remain available.',
      },
      {
        title: 'Packages that fit your screen',
        body: 'Package cards adapt to the available space, keeping titles and readiness details readable.',
      },
      {
        title: 'Account protection, explained',
        body: 'Security information now sits beside your sign-in options so it is clear how your account is protected.',
      },
    ],
  },
  faq: {
    title: 'Help and FAQs',
    sections: [
      {
        title: 'Where are my documents stored?',
        body: 'Your documents are stored in your ReadiNes cloud archive and protected by your account.',
      },
      {
        title: 'Can I export my data?',
        body: 'Use Export all data in Settings to prepare a ZIP with your ReadiNes data and uploaded files.',
      },
      {
        title: 'How do I reset my password?',
        body: 'Use forgot password from the sign-in screen to reset access by email.',
      },
    ],
  },
  feedback: {
    title: 'Send feedback',
    sections: [
      {
        title: 'Tell us what is broken or missing',
        body: `Feedback collection is not connected yet. For now, send issues to ${SUPPORT_EMAIL}.`,
      },
    ],
  },
  privacy: {
    title: 'Privacy and terms',
    sections: [
      {
        title: 'How your data is handled',
        body: 'Your documents and records are stored in your private ReadiNes account, protected by your sign-in and optional PIN. You can export or delete your data at any time from Settings.',
      },
    ],
  },
  about: {
    title: 'About ReadiNes',
    sections: [
      {
        title: 'Be ready for life’s important moments',
        body: 'ReadiNes keeps your family ready for important moments by organizing documents, readiness packs, health context, wealth records, and trusted access in one private account.',
      },
    ],
  },
};
