import { ResponseCache } from './responseCache';
afterEach(() => jest.restoreAllMocks());
it('expires reads and evicts least recently used entries', () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
  const cache = new ResponseCache(2, 1000);
  cache.set('a', 1, 100); cache.set('b', 2, 100);
  expect(cache.get('a')).toBe(1);
  cache.set('c', 3, 100);
  expect(cache.get('b')).toBeUndefined();
  now.mockReturnValue(1101);
  expect(cache.get('a')).toBeUndefined();
  expect(cache.get('c')).toBeUndefined();
});
it('bounds payload memory and clears cached values', () => {
  const cache = new ResponseCache(20, 20);
  cache.set('oversize', 'x'.repeat(100), 1000);
  expect(cache.get('oversize')).toBeUndefined();
  cache.set('small', 'a', 1000);
  expect(cache.get('small')).toBe('a');
  cache.clear(); expect(cache.get('small')).toBeUndefined();
});
