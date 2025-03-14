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
if (!process.env.KENTAA_API_KEY) {
  throw new Error("API keys are missing");
}
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("API keys are missing");
}

const app = express();
app.use(bodyParser.json());

app.get("/webhook", async (req, res) => {
  res.status(200).send();
});

app.post("/webhook", handleKentaaWebhook);
app.post("/stripe-webhook", handleStripeWebhook);
app.post("/create-donation", handleCreateDonation);
app.use("/donate", express.static(path.join(__dirname, "public")));
app.use(Origins);

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
