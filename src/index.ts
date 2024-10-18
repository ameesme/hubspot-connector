import bodyParser from "body-parser";
import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";
import {
  isDonationComplete,
  isWebhookValid,
  WebhookData,
} from "./utilities/validators";
import { Donation, getDonation } from "./utilities/Kentaa";
import { submitForm } from "./utilities/Hubspot";

dotenv.config();
if (!process.env.KENTAA_API_KEY) {
  throw new Error("API keys are missing");
}

const app = express();

app.use(bodyParser.json());

app.get("/webhook", async (req, res) => {
  res.status(200).send();
});

app.post("/webhook", async (req, res) => {
  const { body }: { body: WebhookData } = req;
  const requestBodyValid = isWebhookValid(body);

  if (!requestBodyValid) {
    res.status(400).send("Invalid request body");
    return;
  }

  console.log(
    `[WEBHOOK] Received donation update for donation "${body.object_id}"`
  );

  // Lookup Donation
  const donationId = body.object_id;
  let donation: Donation | null = null;
  try {
    donation = await getDonation(
      process.env.KENTAA_API_KEY as string,
      donationId
    );
  } catch (error) {
    console.error(error);
    console.log(`[KENTAA] Failed to fetch donation "${body.object_id}"`);

    res.status(500).send("Failed to fetch donation");
    return;
  }

  if (!donation) {
    console.log(`[KENTAA] No donation found for id "${body.object_id}"`);

    res.status(500).send("Failed to fetch donation");
    return;
  }

  // Check if requested details are provided
  const donationComplete = isDonationComplete(donation);

  if (!donationComplete) {
    console.log(
      `[KENTAA] Missing donation details for donation "${body.object_id}"`
    );

    res.status(400).send("Donation details are incomplete");
    return;
  }

  // Submit form in HubSpot
  console.log(
    `[HUBSPOT] Submitting form in Hubspot with email "${donation.email}"`
  );

  try {
    const formResult = await submitForm({
      email: donation.email,
      firstname: donation.first_name,
      lastname: donation.last_name,
      hs_language: donation.locale,
      subscribeOneOnOne: donation.newsletter,
      subscribeNews: donation.newsletter,
      amount: parseFloat(donation.total_amount),
      actionId: donation.action_id,
      company: donation.company,
    });
    console.log(formResult);
  } catch (error) {
    console.log(
      `[HUBSPOT] Failed submitting form in Hubspot with email "${donation.email}"`
    );
    console.error(error);
    res.status(500).send("Failed to submit form");
    return;
  }

  res.status(200).send();
});

if (process.env.NODE_ENV === "production") {
  if (!process.env.SSL_PRIVATE_KEY_PATH || !process.env.SSL_CERTIFICATE_PATH) {
    throw new Error("SSL paths are missing");
  }

  const privateKey = fs.readFileSync(process.env.SSL_PRIVATE_KEY_PATH);
  const certificate = fs.readFileSync(process.env.SSL_CERTIFICATE_PATH);

  https
    .createServer(
      {
        key: privateKey,
        cert: certificate,
      },
      app
    )
    .listen(443);
  console.log(`[SERVER] Server is running on port 443`);
} else {
  app.listen(3000, () => {
    console.log(`[SERVER] Server is running on port 3000`);
  });
}
