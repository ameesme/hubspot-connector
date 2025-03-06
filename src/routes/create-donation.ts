import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  // httpClient: Stripe.createFetchHttpClient(),
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
  postalCode?: string;
  city?: string;
  country?: string;

  agreeCheck: boolean;
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

async function handleCreateDonation(
  req: express.Request,
  res: express.Response
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

  if (!amount) {
    res.status(400).send("Invalid donation amount");
    return;
  }

  console.log({
    frequency,
    amount,
  });

  // Create Stripe customer
  const stripeCustomer = await stripe.customers.create({
    email,
    name,
    address: {
      line1: body.address,
      postal_code: body.postalCode,
      city: body.city,
      country: body.country,
    },
  });

  if (!stripeCustomer.id) {
    res.status(500).send("Failed to create Stripe customer");
    console.log("Failed to create Stripe customer");
    return;
  }

  // Create Stripe recurring payment intent
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
          recurring: frequency !== "oneTime" ? {
            interval:  "month",
          } : undefined
        },
        quantity: 1,
      },
    ],
    success_url: "https://sheltersuit.com/donate/success",
    cancel_url: "https://sheltersuit.com/donate/cancel",
  });

  if (!paymentIntent.url) {
    res.status(500).send("Failed to create payment intent");
    console.log("Failed to create payment intent");
    return;
  }

  res.status(200).send(
    JSON.stringify({
      redirectUrl: paymentIntent.url,
    })
  );
  return;
}

export default handleCreateDonation;
