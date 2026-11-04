import type { PackageSummary } from '../../api/types';
type VerificationSource = NonNullable<
  PackageSummary['verificationSources']
>[number];
type PackSummary = PackageSummary;

const genericSourceNames = new Set([
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

const knownProviderRules: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /(^|\.)gov\.uk$/i, name: 'GOV.UK' },
  { pattern: /(^|\.)passportindia\.gov\.in$/i, name: 'Passport Seva' },
  { pattern: /(^|\.)hdfcbank\.com$/i, name: 'HDFC Bank' },
  { pattern: /(^|\.)hdfc\.com$/i, name: 'HDFC Bank' },
  { pattern: /(^|\.)cic\.gc\.ca$/i, name: 'IRCC' },
  { pattern: /(^|\.)iit[a-z]*\.ac\.in$/i, name: 'IIT' },
  { pattern: /(^|\.)iitrpr\.ac\.in$/i, name: 'IIT' },
];

type SourceLike =
  | Pick<VerificationSource, 'organization' | 'title' | 'url'>
  | NonNullable<PackSummary['source']>;

export function sourceHostname(url?: string) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

export function sourceProviderName(source: SourceLike) {
  const organization =
    'organization' in source ? source.organization : source.name;
  const cleanOrganization = cleanName(organization);
  const domainProvider = providerFromDomain(source.url);
  if (cleanOrganization && !isGenericSourceName(cleanOrganization))
    return cleanOrganization;
  if (domainProvider) return domainProvider;
  return (
    sourceHostname(source.url) ||
    cleanName(source.title) ||
    cleanOrganization ||
    'Source'
  );
}

function providerFromDomain(url?: string) {
  const host = sourceHostname(url);
  if (!host) return '';
  if (/(^|\.)canada\.ca$/i.test(host))
    return providerFromCanadaUrl(url) || 'Canada.ca';
  const known = knownProviderRules.find(rule => rule.pattern.test(host));
  if (known) return known.name;
  return '';
}

function providerFromCanadaUrl(url?: string) {
  try {
    const path = new URL(url ?? '').pathname.toLowerCase();
    return path.includes('immigration-refugees-citizenship') ? 'IRCC' : '';
  } catch {
    return '';
  }
}

function cleanName(value?: string | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function isGenericSourceName(value: string) {
  return genericSourceNames.has(value.trim().toLowerCase());
}
