import bodyParser from "body-parser";
import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";
import path from "path";

import handleKentaaWebhook from "./routes/kentaa-webhook";
import handleStripeWebhook from "./routes/stripe-webhook";
import handleCreateDonation from "./routes/create-donation";
import Origins from "./middleware/origins";

dotenv.config();

// Validate Kentaa API keys
const kentaaApiKeyGlobal = process.env.KENTAA_API_KEY;
const kentaaApiKey4038 = process.env.KENTAA_API_KEY_4038;
const kentaaApiKey4555 = process.env.KENTAA_API_KEY_4555;

if (!kentaaApiKeyGlobal && !kentaaApiKey4038 && !kentaaApiKey4555) {
  throw new Error(
    "No Kentaa API keys found. Please set KENTAA_API_KEY_4038, KENTAA_API_KEY_4555, or KENTAA_API_KEY",
  );
}

// Log which keys are configured
if (kentaaApiKey4038) {
  console.log("[CONFIG] Kentaa API key for site 4038 (main) is configured");
}
if (kentaaApiKey4555) {
  console.log("[CONFIG] Kentaa API key for site 4555 (sleepout) is configured");
}
if (kentaaApiKeyGlobal && (!kentaaApiKey4038 || !kentaaApiKey4555)) {
  console.log(
    "[CONFIG] Using fallback KENTAA_API_KEY for sites without specific keys",
  );
}
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("API keys are missing");
}

const app = express();
app.use(bodyParser.json());
app.use(Origins);

app.get("/webhook", async (req, res) => {
  res.status(200).send();
});

app.post("/webhook", handleKentaaWebhook);
app.post("/stripe-webhook", handleStripeWebhook);
app.post("/create-donation", handleCreateDonation);
app.use("/donate", express.static(path.join(__dirname, "public")));

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
