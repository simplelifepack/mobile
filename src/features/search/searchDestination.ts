import type { GlobalSearchResult } from '../../api/web.types';
export function searchDestination(result: GlobalSearchResult) {
  const [path, query = ''] = result.navigation.path.split('?');
  const params = Object.fromEntries(
    query
      .split('&')
      .filter(Boolean)
      .map(pair => {
        const [key, ...parts] = pair.split('=');
        return [
          decodeURIComponent(key),
          decodeURIComponent(parts.join('=').replace(/\+/g, ' ')),
        ];
      }),
  );
  switch (result.section) {
    case 'documents':
      return {
        screen: 'DocumentLibrary' as const,
        params: {
          documentId: decodeURIComponent(path.split('/')[3] || result.id),
        },
      };
    case 'packages':
      return {
        screen: 'Packages' as const,
        params: {
          slug: params.pack || undefined,
          query: params.pack ? undefined : result.title,
        },
      };
    case 'health':
      return {
        screen: 'Health' as const,
        params: {
          memberId: params.member || undefined,
          recordId: params.record || undefined,
          tab: params.tab || undefined,
        },
      };
    case 'wealth':
      return {
        screen: 'Wealth' as const,
        params: { recordId: params.record || result.id },
      };
    case 'family':
      return {
        screen: 'Family' as const,
        params: { memberId: params.member || result.id },
      };
    case 'trust':
      return {
        screen: 'TrustedAccess' as const,
        params: { memberId: params.member || result.id },
      };
  }
}
