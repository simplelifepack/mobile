import type { WealthHandoffSendResponse } from '../../api/wealth.api';

type Sms = NonNullable<WealthHandoffSendResponse['results'][number]['sms']>;
type EmailResult = WealthHandoffSendResponse['results'][number];

export type HandoffOutcome = 'delivered' | 'partial' | 'failed';

export function handoffOutcome(results: EmailResult[]): HandoffOutcome {
  const acceptedCount = results.filter(result => result.sent).length;
  if (acceptedCount === 0) return 'failed';
  return acceptedCount === results.length ? 'delivered' : 'partial';
}

export function emailDeliveryFailureReason(reason?: EmailResult['reason']) {
  switch (reason) {
    case 'email_disabled':
      return 'Email delivery is disabled';
    case 'invalid_recipient':
      return 'Recipient address is invalid';
    case 'delivery_failed':
      return 'Email could not be accepted';
    default:
      return 'Email delivery failed';
  }
}

export function smsDeliveryLabel(sms?: Sms) {
  if (!sms) return 'SMS status unavailable';
  if (sms.status === 'accepted')
    return 'SMS accepted by provider (delivery not confirmed)';
  if (sms.status === 'unknown')
    return 'SMS outcome unknown; check before retrying';
  switch (sms.reason) {
    case 'missing_phone':
      return 'SMS not sent: no phone number';
    case 'not_configured':
      return 'SMS not sent: provider not configured';
    case 'provider_rejected':
      return 'SMS not sent: provider rejected request';
    default:
      return 'SMS not sent';
  }
}
