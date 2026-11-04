import { dueTiming, packageOverview } from './homeOverview';
const today = new Date(2026, 9, 26, 23, 59);
it('compares calendar days instead of treating today as overdue after midnight', () => {
  expect(dueTiming('2026-10-26', today)).toMatchObject({
    label: 'Due today',
    overdue: false,
  });
  expect(dueTiming('2026-10-25', today)).toMatchObject({
    label: '1 day overdue',
    overdue: true,
  });
  expect(dueTiming('2026-10-30', today)).toMatchObject({
    label: 'In 4 days',
    overdue: false,
  });
  expect(dueTiming(null, today)).toMatchObject({
    label: 'Review details',
    overdue: false,
  });
});
it('does not invent readiness for an empty package collection', () => {
  expect(packageOverview([], [])).toEqual({ ready: 0, total: 0, percent: 0 });
});
