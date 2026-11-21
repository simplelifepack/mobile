export type SubscriptionPlan = {
  id: 'monthly' | 'annual';
  title: string;
  description: string;
  productIds: {
    ios: string;
    android: string;
  };
};

export const subscriptionPlans: readonly SubscriptionPlan[] = [
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
];
