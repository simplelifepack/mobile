import { memberBirthDetails } from './memberBirth';

afterEach(() => jest.useRealTimers());

it('calculates age using the local calendar and handles missing or invalid dates', () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 10, 11, 12));
  expect(memberBirthDetails('2000-11-12')).toEqual({ formatted: '12 Nov 2000', age: 25 });
  expect(memberBirthDetails('2000-11-11')).toEqual({ formatted: '11 Nov 2000', age: 26 });
  expect(memberBirthDetails('2027-01-01')?.age).toBeUndefined();
  expect(memberBirthDetails('2026-02-30')).toBeUndefined();
  expect(memberBirthDetails(null)).toBeUndefined();
});
