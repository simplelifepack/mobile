import type { WealthHandoffSendResponse } from '../../api/wealth.api';
import {
  emailDeliveryFailureReason,
  handoffOutcome,
  smsDeliveryLabel,
} from './handoffDelivery';

it('classifies complete, partial and failed email handoffs', () => {
  const result = (
    sent: boolean,
  ): WealthHandoffSendResponse['results'][number] => ({
    recipientId: 'recipient',
    email: 'person@example.com',
    handoffType: 'family',
    sent,
  });
  expect(handoffOutcome([result(true)])).toBe('delivered');
  expect(handoffOutcome([result(true), result(false)])).toBe('partial');
  expect(handoffOutcome([result(false)])).toBe('failed');
});

it('uses readable email delivery failure reasons', () => {
  expect(emailDeliveryFailureReason('email_disabled')).toBe(
    'Email delivery is disabled',
  );
  expect(emailDeliveryFailureReason('invalid_recipient')).toBe(
    'Recipient address is invalid',
  );
  expect(emailDeliveryFailureReason('delivery_failed')).toBe(
    'Email could not be accepted',
  );
});

it('distinguishes provider acceptance, failures and uncertain delivery', () => {
  expect(smsDeliveryLabel({ status: 'accepted' })).toContain(
    'delivery not confirmed',
  );
  expect(
    smsDeliveryLabel({ status: 'not_sent', reason: 'missing_phone' }),
  ).toContain('no phone');
  expect(
    smsDeliveryLabel({ status: 'not_sent', reason: 'not_configured' }),
  ).toContain('not configured');
  expect(
    smsDeliveryLabel({ status: 'unknown', reason: 'delivery_unknown' }),
  ).toContain('check before retrying');
  expect(smsDeliveryLabel()).toContain('unavailable');
});
