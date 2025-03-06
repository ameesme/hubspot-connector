import express from "express";
import { submitKentaaDonationForm } from "../utilities/Hubspot";
import { Donation, getDonation, isKentaaDonationComplete, isKentaaWebhookValid, KentaaWebhookData } from "../utilities/Kentaa";

async function handleKentaaWebhook(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const { body }: { body: KentaaWebhookData } = req;
  const requestBodyValid = isKentaaWebhookValid(body);

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
  const donationComplete = isKentaaDonationComplete(donation);

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
    const formResult = await submitKentaaDonationForm({
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
  return;
}

export default handleKentaaWebhook;
