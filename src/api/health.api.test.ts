import { healthApi } from './health.api';
import { request } from './client';
jest.mock('./client', () => ({ request: jest.fn().mockResolvedValue({}) }));
it('sends only the strict tracking schema when given a full available or tracked metric', async () => {
  const item = {
    id: 'tracking-row',
    metricKey: 'cholesterol',
    displayName: 'Total Cholesterol',
    context: null,
    bodySite: null,
    unit: 'mg/dL',
    enabled: true,
    historicalReadingCount: 2,
    isTracked: false,
    latestValue: 150,
  };
  await healthApi.trackMetric('profile', item);
  expect(request).toHaveBeenCalledWith(
    '/api/health/members/profile/tracked-metrics',
    {
      method: 'POST',
      requiresAuth: true,
      body: {
        metricKey: 'cholesterol',
        displayName: 'Total Cholesterol',
        context: null,
        bodySite: null,
      },
    },
  );
});
