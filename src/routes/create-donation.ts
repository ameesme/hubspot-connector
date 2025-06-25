import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { submitStripeDonationForm } from "../utilities/Hubspot";

dotenv.config();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});

interface FormData {
  donationFrequency: "oneTime" | "monthly";
  donationAmount: string | "other";
  oneTimeCustomAmount?: string;
  monthlyCustomAmount?: string;

  email: string;
  firstName: string;
  lastName?: string;
  newsletter: boolean;
  confirmationPDF: boolean;

  isCompany: boolean;
  companyName?: string;
  companyURL?: string;
  address?: string;
  city?: string;
  country?: string;

  agreeCheck: boolean;
  campaignName?: string;
  locale?: string;
}

function isFormDataValid(data: FormData): boolean {
  if (
    !data.donationFrequency ||
    !data.donationAmount ||
    !data.email ||
    !data.firstName ||
    !data.agreeCheck
  ) {
    return false;
  }

  if (data.donationAmount === "other") {
    if (
      (data.donationFrequency === "oneTime" && !data.oneTimeCustomAmount) ||
      (data.donationFrequency === "monthly" && !data.monthlyCustomAmount)
    ) {
      return false;
    }
  }

  if (data.isCompany && (!data.companyURL || !data.companyName)) {
    return false;
  }

  return true;
}

const redirectUrlMap: Record<string, string> = {
  "nl-NL": "https://sheltersuit.com/nl/doneer/bedankt",
  nl: "https://sheltersuit.com/nl/doneer/bedankt",
  "de-DE": "https://sheltersuit.com/de/spenden/danke",
  de: "https://sheltersuit.com/de/spenden/danke",
};

async function handleCreateDonation(
  req: express.Request,
  res: express.Response,
): Promise<void> {
  const { body }: { body: FormData } = req;

  const requestBodyValid = isFormDataValid(body);
  if (!requestBodyValid) {
    res.status(400).send("Invalid request body");
    return;
  }

  const frequency = body.donationFrequency;
  const fixedAmount =
    body.donationAmount === "other" ? null : parseFloat(body.donationAmount);
  const customAmount =
    body.donationAmount === "other"
      ? body.donationFrequency === "oneTime"
        ? parseFloat(body?.oneTimeCustomAmount as string)
        : parseFloat(body?.monthlyCustomAmount as string)
      : undefined;
  const amount = customAmount || fixedAmount;
  const name = `${body.firstName}${body.lastName ? ` ${body.lastName}` : ""}`;
  const email = body.email;
  const getReceipt = body.confirmationPDF;

  if (!amount) {
    res.status(400).send("Invalid donation amount");
    return;
  }

  // Check if customer already exists
  const existingCustomer = await stripe.customers.list({
    email,
    limit: 1,
  });

  let stripeCustomer;

  if (existingCustomer.data.length && !existingCustomer.data[0].deleted) {
    console.log(
      `[STRIPE] Customer already exists: ${existingCustomer.data[0].id}`,
    );
    // Update customer with data
    stripeCustomer = await stripe.customers.update(
      existingCustomer.data[0].id,
      {
        name,
        address: {
          line1: body.address,
          city: body.city,
          country: body.country,
        },
        metadata: {
          "company-url": body.companyURL || null,
          "hubspot-integration": "true",
        },
      },
    );
  } else {
    console.log("[STRIPE] Creating new customer");
    stripeCustomer = await stripe.customers.create({
      email,
      name,
      address: {
        line1: body.address,
        city: body.city,
        country: body.country,
      },
      metadata: {
        "company-url": body.companyURL || null,
        "hubspot-integration": "true",
      },
    });
  }

  if (!stripeCustomer.id) {
    res.status(500).send("Failed to create Stripe customer");
    console.log("Failed to create Stripe customer");
    return;
  }

  // Create Hubspot contact
  try {
    await submitStripeDonationForm({
      email,
      firstName: body.firstName,
      lastName: body.lastName,
      newsletter: body.newsletter,
      companyName: body.companyName,
      companyURL: body.companyURL,
      address: body.address,
      city: body.city,
      country: body.country,
      campaign_name: body.campaignName,
      locale: body.locale,
    });
  } catch (error) {
    console.log(
      `[HUBSPOT] Failed submitting form in Hubspot with email "${email}"`,
    );
    console.error(error);
    res.status(500).send("Failed to submit form");
    return;
  }

  // Create Stripe recurring payment intent
  const metadata = {
    email,
  };
  const successUrl =
    (body.locale && redirectUrlMap[body.locale]) ??
    "https://sheltersuit.com/donate/thankyou";

  const paymentIntentData = frequency === "oneTime" && {
    receipt_email: getReceipt ? email : undefined,
    metadata: {
      campaign_name: body.campaignName || "none",
    },
  };
  const paymentIntent = await stripe.checkout.sessions.create({
    mode: frequency === "oneTime" ? "payment" : "subscription",
    customer: stripeCustomer.id,
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Sheltersuit Donation",
          },
          unit_amount: amount * 100,
          recurring:
            frequency !== "oneTime"
              ? {
                  interval: "month",
                }
              : undefined,
        },
        quantity: 1,
      },
    ],
    metadata,
    payment_intent_data: paymentIntentData || undefined,
    success_url: successUrl,
    cancel_url: "https://sheltersuit.com/donate",
  });

  if (!paymentIntent.url) {
    res.status(500).send("Failed to create payment intent");
    console.log("Failed to create payment intent");
    return;
  }

  res.status(200).send(
    JSON.stringify({
      redirectUrl: paymentIntent.url,
    }),
  );
  return;
}

export default handleCreateDonation;
