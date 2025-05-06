export function submitKentaaDonationForm(formData: {
  email: string;
  firstname: string;
  lastname: string;
  hs_language: string;
  subscribeOneOnOne: boolean;
  subscribeNews: boolean;
  amount: number;
  actionId?: number;
  company?: string;
}): Promise<any> {
  const url =
    "https://api.hsforms.com/submissions/v3/integration/submit/5575635/a2867ab8-08be-4daf-9380-2b2bc31cbd39";

  const data = {
    submittedAt: Date.now().toString(),
    fields: [
      {
        objectTypeId: "0-1",
        name: "email",
        value: formData.email,
      },
      {
        objectTypeId: "0-1",
        name: "firstname",
        value: formData.firstname,
      },
      {
        objectTypeId: "0-1",
        name: "lastname",
        value: formData.lastname,
      },
      {
        objectTypeId: "0-1",
        name: "kentaa_donation_amount",
        value: formData.amount,
      },
      {
        objectTypeId: "0-1",
        name: "kentaa_company_name",
        value: formData.company,
      },
      {
        objectTypeId: "0-1",
        name: "hs_language",
        value: formData.hs_language,
      },
      {
        objectTypeId: "0-1",
        name: "kentaa_action_id",
        value: formData.actionId || 0,
      },
    ],
    context: {
      pageUri: "https://fundraisers.sheltersuit.com",
      pageName: "Sheltersuit Fundraiser",
    },
    legalConsentOptions: {
      consent: {
        consentToProcess: true,
        text: "I agree to allow Sheltersuit to store and process my personal data.",
        communications: [
          {
            value: true,
            subscriptionTypeId: 105326153,
            text: "I agree to receive donation confirmations and other essential information (* required)",
          },
          {
            value: formData.subscribeOneOnOne || false,
            subscriptionTypeId: 6120458,
            text: "Employees can contact me via one to one communication (* required)",
          },
          {
            value: formData.subscribeNews || false,
            subscriptionTypeId: 6120420,
            text: "I want to receive updates via the newsletter",
          },
        ],
      },
    },
  };

  const filteredData = {
    ...data,
    fields: data.fields.filter((field) => field.value !== undefined),
  };

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(filteredData),
  })
    .then((response) => {
      if (!response.ok) {
        const responseData = response.json();
        console.log(responseData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data: unknown): any => {
      if (typeof data === "object" && data !== null) {
        return data;
      }
      throw new Error("Invalid response format");
    });
}

export async function submitStripeDonationForm(formData: {
  email: string;
  firstName: string;
  lastName?: string;
  companyName?: string;
  companyURL?: string;
  address?: string;
  city?: string;
  country?: string;
  campaign_name?: string;
  locale?: string;
  newsletter: boolean;
}): Promise<any> {
  const url =
    "https://api.hsforms.com/submissions/v3/integration/submit/5575635/8a61e0bc-07e0-4430-afc7-a00e4f45c96d";

  const data = {
    fields: [
      {
        objectTypeId: "0-1",
        name: "email",
        value: formData.email,
      },
      {
        objectTypeId: "0-1",
        name: "firstname",
        value: formData.firstName,
      },
      {
        objectTypeId: "0-1",
        name: "lastname",
        value: formData.lastName,
      },
      {
        objectTypeId: "0-1",
        name: "donates_as_company",
        value: !!formData.companyName,
      },
      {
        objectTypeId: "0-2",
        name: "name",
        value: formData.companyName,
      },
      {
        objectTypeId: "0-2",
        name: "domain",
        value: formData.companyURL,
      },
      {
        objectTypeId: "0-2",
        name: "address",
        value: formData.address,
      },
      {
        objectTypeId: "0-2",
        name: "city",
        value: formData.city,
      },
      {
        objectTypeId: "0-2",
        name: "country",
        value: formData.country,
      },
      {
        objectTypeId: "0-1",
        name: "campaign_name",
        value: formData.campaign_name,
      },
      {
        objectTypeId: "0-1",
        name: "hs-language",
        value: (formData.locale || "en").toLowerCase(),
      },
    ],
    context: {
      pageUri: "https://sheltersuit.com/donate",
      pageName: "Donation Form",
    },
    legalConsentOptions: {
      consent: {
        consentToProcess: true,
        text: "I agree to allow Sheltersuit to store and process my personal data.",
        communications: [
          {
            value: true,
            subscriptionTypeId: 105326153,
            text: "I agree to receive donation confirmations and other essential information (* required)",
          },
          {
            value: !!formData.newsletter || false,
            subscriptionTypeId: 6120420,
            text: "I want to receive updates via the newsletter",
          },
        ],
      },
    },
  };

  const filteredData = {
    ...data,
    fields: data.fields.filter(
      (field) => field.value !== undefined && field.value !== null
    ),
  };

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(filteredData),
  })
    .then(async (response) => {
      if (!response.ok) {
        const responseData = await response.json();
        console.log(responseData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data: unknown): any => {
      if (typeof data === "object" && data !== null) {
        return data;
      }
      throw new Error("Invalid response format");
    });
}

export async function submitStripePaymentReceipt(formData: {
  email: string;
  amountInCents: number;
  currency: string;
  recurring: boolean;
  companyURL?: string;
}): Promise<any> {
  const url =
    "https://api.hsforms.com/submissions/v3/integration/submit/5575635/a638f105-8287-4d70-8830-4c0893bd5a3a";

  const amount = (formData.amountInCents / 100).toFixed(2);

  const data = {
    fields: [
      {
        objectTypeId: "0-1",
        name: "email",
        value: formData.email,
      },
      {
        objectTypeId: "0-1",
        name: "stripe_donation_amount",
        value: amount,
      },
      {
        objectTypeId: "0-1",
        name: "stripe_donation_currency",
        value: formData.currency,
      },
      {
        objectTypeId: "0-1",
        name: "stripe_donation_recurring",
        value: formData.recurring,
      },
      {
        objectTypeId: "0-2",
        name: "domain",
        value: formData.companyURL,
      },
    ],
    context: {
      pageUri: "https://sheltersuit.com/donate",
      pageName: "Donation Form",
    },
    legalConsentOptions: {
      consent: {
        consentToProcess: true,
        text: "I agree to allow Sheltersuit to store and process my personal data.",
      },
    },
  };

  const filteredData = {
    ...data,
    fields: data.fields.filter((field) => field.value !== undefined),
  };

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(filteredData),
  })
    .then((response) => {
      if (!response.ok) {
        const responseData = response.json();
        console.log(responseData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data: unknown): any => {
      if (typeof data === "object" && data !== null) {
        return data;
      }
      throw new Error("Invalid response format");
    });
}
