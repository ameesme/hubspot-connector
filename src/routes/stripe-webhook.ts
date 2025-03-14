import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { submitStripePaymentReceipt } from "../utilities/Hubspot";

dotenv.config();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});

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
    const customerEmail =
      event.data.object.customer_email ||
      event.data.object.customer_details?.email;
    const totalAmount = event.data.object.amount_total;
    const currency = event.data.object.currency;
    const recurring = event.data.object.mode === "subscription";

    // Get Stripe Customer
    const customer = await stripe.customers.retrieve(
      event.data.object.customer as string
    );

    if (
      !customerEmail ||
      !totalAmount ||
      !currency ||
      typeof recurring !== "boolean"
    ) {
      console.log("[WEBHOOK] Invalid event data", event);
      res.status(400).send("Invalid event data");
      return;
    }

    if (!customer || customer.deleted) {
      console.log("[WEBHOOK] Customer not found", event);
      res.status(200).send("Customer not found");
      return;
    }

    // Get customer metadata
    const metadata = customer.metadata;

    // Check if the customer has hubspot-integration
    if (!metadata || !metadata["hubspot-integration"]) {
      console.log("[WEBHOOK] Customer not found", event);
      res.status(200).send("Customer not found");
      return;
    }

    await submitStripePaymentReceipt({
      email: customerEmail,
      amountInCents: totalAmount,
      currency,
      recurring,
      companyURL: metadata["company-url"],
    });
  }

  res.status(200).send();
}

export default handleStripeWebhook;
