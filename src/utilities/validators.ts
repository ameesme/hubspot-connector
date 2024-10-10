// {
//     "object_type": "action",
//     "object_id": 42,
//     "event_type": "counters.update",
//     "application": "Kentaa",
//     "site_id": 12
// }

import { Donation } from "./Kentaa";

// Accept donations.update event only

export interface WebhookData {
  object_type: string;
  object_id: number;
  event_type: string;
  application: string;
  site_id: number;
}

export function isWebhookValid(data: WebhookData): boolean {
  if (!data || !data.event_type || !data.object_id) {
    return false;
  }

  return data.event_type === "donations.update";
}

// email, total_amount, newsletter and payment_status must be provided

export function isDonationComplete(data: Donation): boolean {
  if (
    !data ||
    !data.email ||
    !data.total_amount ||
    !data.payment_status ||
    typeof data.newsletter !== "boolean"
  ) {
    return false;
  }

  return true;
}
