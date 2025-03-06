import express from "express";
import Stripe from "stripe";
import { submitStripePaymentReceipt } from "../utilities/Hubspot";

async function handleStripeWebhook(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const eventType = req.body?.type;

  if (!eventType) {
    res.status(400).send("Invalid request body");
    return;
  }

  console.log(`[WEBHOOK] Received Stripe event "${eventType}"`);

  if (eventType === "checkout.session.completed") {
    const event = req.body as Stripe.CheckoutSessionCompletedEvent;

    console.log(
      `[WEBHOOK] Payment completed for session ${event.data.object.id}`
    );
    const customerEmail = event.data.object.customer_email || event.data.object.customer_details?.email;
    const totalAmount = event.data.object.amount_total;
    const currency = event.data.object.currency;
    const recurring = event.data.object.mode === "subscription";

    if (!customerEmail || !totalAmount || !currency || typeof recurring !== "boolean") {
      console.log("[WEBHOOK] Invalid event data", event);
      res.status(400).send("Invalid event data");
      return;
    }

    await submitStripePaymentReceipt({
      email: customerEmail,
      amountInCents: totalAmount,
      currency,
      recurring,
    });
  }

  res.status(200).send();
}

export default handleStripeWebhook;
