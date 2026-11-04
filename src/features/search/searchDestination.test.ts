import { searchDestination } from './searchDestination';
import type { GlobalSearchResult } from '../../api/web.types';
const result = (
  section: GlobalSearchResult['section'],
  path: string,
): GlobalSearchResult => ({
  id: 'fallback',
  title: 'Title',
  subtitle: '',
  section,
  navigation: { path },
});
it('opens the exact package selected by the backend pack parameter', () => {
  expect(
    searchDestination(result('packages', '/packages?pack=uk-student-visa')),
  ).toEqual({
    screen: 'Packages',
    params: { slug: 'uk-student-visa', query: undefined },
  });
});
it('preserves the health member, record and tab from web search destinations', () => {
  expect(
    searchDestination(
      result('health', '/health?member=m1&tab=Records&record=r1'),
    ),
  ).toEqual({
    screen: 'Health',
    params: { memberId: 'm1', recordId: 'r1', tab: 'Records' },
  });
});
it('decodes document destinations without using browser URL globals', () => {
  expect(
    searchDestination(result('documents', '/documents/identity/doc%201')),
  ).toEqual({ screen: 'DocumentLibrary', params: { documentId: 'doc 1' } });
});
