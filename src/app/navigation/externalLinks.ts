import { digiLockerReturn } from './digilockerReturn';
import type { RootStackParamList } from './types';
export const appLinkHosts = [
  'readines.com',
  'www.readines.com',
  'frontend-web-nine-amber.vercel.app',
];
export type ExternalDestination = {
  [K in keyof RootStackParamList]: { screen: K; params: RootStackParamList[K] };
}[keyof RootStackParamList];
export function externalDestination(url: string): ExternalDestination | null {
  const returned = digiLockerReturn(url);
  if (returned)
    return {
      screen: 'Main',
      params: {
        screen: 'Documents',
        params: returned.session
          ? { digilockerSession: returned.session }
          : { digilockerError: returned.error },
      },
    };
  try {
    const match = /^(https|readiness):\/\/([^/?#]+)([^#]*)/i.exec(url);
    if (
      !match ||
      (match[1].toLowerCase() === 'https' &&
        !appLinkHosts.includes(match[2].toLowerCase()))
    )
      return null;
    const value =
      match[1].toLowerCase() === 'readiness'
        ? `/${match[2]}${match[3]}`
        : match[3];
    const [path, query = ''] = value.split('?');
    const segments = path.split('/').filter(Boolean).map(decodeURIComponent);
    const params = Object.fromEntries(
      query
        .split('&')
        .filter(Boolean)
        .map(pair => {
          const [key, ...rest] = pair.split('=');
          return [
            decodeURIComponent(key),
            decodeURIComponent(rest.join('=').replace(/\+/g, ' ')),
          ];
        }),
    );
    if (segments[0] === 'invite' && segments[1])
      return { screen: 'Invitation', params: { token: segments[1] } };
    if (segments[0] === 'reset-password' && params.token)
      return { screen: 'ResetPassword', params: { token: params.token } };
    switch (segments[0]) {
      case 'documents':
        return {
          screen: 'DocumentLibrary',
          params: { documentId: segments[2] || params.document || undefined },
        };
      case 'packages':
        return {
          screen: 'Packages',
          params: {
            slug: params.pack || segments[1] || undefined,
            query: params.q || undefined,
          },
        };
      case 'health':
        return {
          screen: 'Health',
          params: {
            memberId: params.member,
            recordId: params.record,
            tab: [
              'Overview',
              'Measurements',
              'Timeline',
              'Medications',
              'Records',
              'Profile',
            ].includes(params.tab)
              ? params.tab
              : undefined,
          },
        };
      case 'wealth':
        return { screen: 'Wealth', params: { recordId: params.record } };
      case 'family':
        return { screen: 'Family', params: { memberId: params.member } };
      case 'trust':
        return { screen: 'TrustedAccess', params: { memberId: params.member } };
      case 'legacy':
        return { screen: 'Legacy', params: undefined };
      case 'settings':
        return { screen: 'Settings', params: undefined };
      case 'home':
        return { screen: 'Main', params: undefined };
      default:
        return null;
    }
  } catch {
    return null;
  }
}
