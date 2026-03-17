import dotenv from "dotenv";
dotenv.config();

const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID || "G-996X9GF1B5";
const GA4_API_SECRET = process.env.GA4_API_SECRET || "x1tLj_WBSAWtThEdOg0r8Q";

interface GA4PurchaseEvent {
  clientId: string;
  transactionId: string;
  value: number;
  currency: string;
  recurring: boolean;
  isCompany: boolean;
  locale?: string;
}

export async function sendGA4Purchase(data: GA4PurchaseEvent): Promise<void> {
  if (!data.clientId || !data.transactionId) {
    console.log("[GA4] Missing client_id or transaction_id, skipping");
    return;
  }

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;

  // Determine order type and customer type
  const orderType = data.recurring ? "Maandelijks" : "Eenmalig";
  const customerType = data.isCompany ? "Bedrijf" : "Particulier";
  const language = (data.locale || "en").split("-")[0].toUpperCase();

  const payload = {
    client_id: data.clientId,
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: data.transactionId,
          value: data.value,
          tax: 0,
          shipping: 0,
          currency: data.currency.toUpperCase(),
          language: language,
          order_type: orderType,
          customer_type: customerType,
          items: [
            {
              item_name: `Donatie ${data.value},-`,
              item_id: data.transactionId,
              item_category: orderType,
              item_category2: customerType,
              currency: data.currency.toUpperCase(),
              price: data.value,
              quantity: 1,
            },
          ],
        },
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[GA4] Failed to send purchase event: ${response.status}`);
    } else {
      console.log(
        `[GA4] Purchase event sent for transaction ${data.transactionId}`,
      );
    }
  } catch (error) {
    console.error("[GA4] Error sending purchase event:", error);
  }
}
