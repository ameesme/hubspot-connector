import { Client } from "@hubspot/api-client";
import bodyParser from "body-parser";
import express from "express";
import dotenv from "dotenv";
import {
  isDonationComplete,
  isWebhookValid,
  WebhookData,
} from "./utilities/validators";
import { Donation, getDonation } from "./utilities/Kentaa";
import {
  BatchResponseSimplePublicUpsertObject,
  BatchResponseSimplePublicUpsertObjectWithErrors,
} from "@hubspot/api-client/lib/codegen/crm/contacts";

dotenv.config();
if (!process.env.HUBSPOT_API_KEY || !process.env.KENTAA_API_KEY) {
  throw new Error("API keys are missing");
}

const app = express();
const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_API_KEY });

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

  // Create or update contact in HubSpot
  console.log(
    `[HUBSPOT] Upserting contact in Hubspot with email "${donation.email}"`
  );

  const properties = {
    firstname: donation.first_name,
    lastname: donation.last_name,
    newsletter_signup: donation.newsletter.toString(),
    hs_language: donation.locale,
    lifecyclestage: "subscriber",
  };

  console.log({ properties });

  let contactDetails:
    | BatchResponseSimplePublicUpsertObjectWithErrors
    | BatchResponseSimplePublicUpsertObject
    | null = null;
  try {
    contactDetails = await hubspotClient.crm.contacts.batchApi.upsert({
      inputs: [
        {
          id: donation.email,
          idProperty: "email",
          properties,
        },
      ],
    });
    hubspotClient.marketing.forms.formsApi.create;
  } catch (error) {
    console.log(
      `[HUBSPOT] Failed upserting contact in Hubspot with email "${donation.email}"`
    );
    console.error(error);
    res.status(500).send("Failed to create/update contact");
    return;
  }

  if (!contactDetails || contactDetails.status !== "COMPLETE") {
    console.log(
      `[HUBSPOT] Hubspot contact with email "${donation.email}" was not completed`
    );
    res.status(500).send("Failed to create/update contact");
    return;
  }

  console.log(contactDetails);

  res.status(200).send();
});

app.listen(4000, () => {
  console.log(`server running on port 4000`);
});
