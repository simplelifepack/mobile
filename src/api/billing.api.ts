import { request } from './client';

export type BillingPlanId = 'monthly' | 'annual';
export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  amountPaise: number;
  currency: string;
  period: 'monthly' | 'yearly';
  interval: number;
  totalCount: number;
};
export type BillingCatalogue = {
  testPaymentButtonId?: string;
  available: boolean;
  plans: Record<BillingPlanId, BillingPlan>;
  annualMonthlyEquivalent: number;
  annualSavingsPaise: number;
};
export type BillingSubscription = {
  id: string;
  plan: BillingPlanId;
  status: string;
  paidThrough: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  nextChargeAt: string | null;
  cancelAtCycleEnd: boolean;
};
export type BillingStatus = {
  accountTier: 'free' | 'paid';
  legacyPaid?: boolean;
  subscription: BillingSubscription | null;
};
export type CheckoutResponse =
  | { alreadyPaid: true }
  | {
      alreadyPaid: false;
      keyId: string;
      subscriptionId: string;
      plan: BillingPlan;
    };
export type CheckoutVerification = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};
export const billingApi = {
  plans: () =>
    request<BillingCatalogue>('/api/billing/plans', { dedupeMs: 10000 }),
  checkout: (plan: BillingPlanId) =>
    request<CheckoutResponse>('/api/billing/checkout', {
      method: 'POST',
      requiresAuth: true,
      body: { plan },
    }),
  verify: (response: CheckoutVerification) =>
    request<BillingStatus>('/api/billing/verify', {
      method: 'POST',
      requiresAuth: true,
      body: response,
    }),
  status: () =>
    request<BillingStatus>('/api/billing/subscription', {
      requiresAuth: true,
      dedupeMs: 0,
    }),
  cancel: () =>
    request<{ cancelled: boolean }>('/api/billing/cancel', {
      method: 'POST',
      requiresAuth: true,
    }),
};
export const billingPrice = (paise: number) =>
  (paise / 100).toLocaleString('en-IN');
