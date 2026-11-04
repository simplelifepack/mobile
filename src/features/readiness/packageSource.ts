import type { PackageSummary, VerificationSource } from '../../api/types';

const genericNames = new Set([
  'authority',
  'bank',
  'education',
  'finance',
  'financial',
  'government',
  'insurance',
  'official',
  'source',
  'travel',
  'university',
]);

const knownProviders: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /(^|\.)gov\.uk$/i, name: 'GOV.UK' },
  { pattern: /(^|\.)passportindia\.gov\.in$/i, name: 'Passport Seva' },
  { pattern: /(^|\.)hdfcbank\.com$/i, name: 'HDFC Bank' },
  { pattern: /(^|\.)hdfc\.com$/i, name: 'HDFC Bank' },
  { pattern: /(^|\.)cic\.gc\.ca$/i, name: 'IRCC' },
  { pattern: /(^|\.)iit[a-z]*\.ac\.in$/i, name: 'IIT' },
];

type SourceLike =
  | Pick<VerificationSource, 'organization' | 'title' | 'url'>
  | NonNullable<PackageSummary['source']>;

const clean = (value?: string | null) =>
  typeof value === 'string' ? value.trim() : '';

export function sourceHostname(url?: string) {
  if (!url) return '';
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(url);
  return match ? match[1].replace(/^www\./i, '') : url;
}

function providerFromDomain(url?: string) {
  const host = sourceHostname(url);
  if (!host) return '';
  if (/(^|\.)canada\.ca$/i.test(host)) {
    return /immigration-refugees-citizenship/i.test(url ?? '')
      ? 'IRCC'
      : 'Canada.ca';
  }
  return knownProviders.find(rule => rule.pattern.test(host))?.name ?? '';
}

export function sourceProviderName(source: SourceLike) {
  const organization = clean(
    'organization' in source ? source.organization : source.name,
  );
  if (organization && !genericNames.has(organization.toLowerCase())) {
    return organization;
  }
  return (
    providerFromDomain(source.url) ||
    sourceHostname(source.url) ||
    clean(source.title) ||
    organization ||
    'Source'
  );
}

export type SourceLink = { url: string; name: string; title?: string };

export function uniqueSources<T extends { url?: string }>(sources: T[] = []) {
  const seen = new Set<string>();
  return sources.filter(item => {
    if (!item.url) return false;
    const key = item.url.trim().replace(/\/+$/, '').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function packageSourceLinks(pack?: PackageSummary): SourceLink[] {
  if (!pack) return [];
  const verified = uniqueSources(pack.verificationSources);
  if (verified.length) {
    return verified.map(item => ({
      url: item.url,
      name: sourceProviderName(item),
      title: item.title,
    }));
  }
  return pack.source?.url
    ? [
        {
          url: pack.source.url,
          name: sourceProviderName(pack.source),
          title: pack.source.title ?? pack.source.name,
        },
      ]
    : [];
}
