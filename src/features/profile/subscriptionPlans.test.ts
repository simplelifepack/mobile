import { subscriptionPlans } from './subscriptionPlans';

it('defines the planned monthly and annual products for both stores', () => {
  expect(subscriptionPlans).toEqual([
    {
      id: 'monthly',
      title: 'Monthly',
      description: 'Monthly subscription',
      productIds: {
        ios: 'readines_monthly',
        android: 'readines_monthly',
      },
    },
    {
      id: 'annual',
      title: 'Annual',
      description: 'Annual subscription',
      productIds: {
        ios: 'readines_annual',
        android: 'readines_annual',
      },
    },
  ]);
});
