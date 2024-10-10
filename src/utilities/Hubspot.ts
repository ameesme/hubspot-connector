export function submitForm(formData: FormData): Promise<any> {
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
        name: "hs_language",
        value: formData.hs_language,
      },
      {
        objectTypeId: "0-1",
        name: "kentaa_action_id",
        value: formData.actionId,
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

  console.log(JSON.stringify(data, null, 2));

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
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

// Define an interface for the form data
interface FormData {
  email: string;
  firstname: string;
  lastname: string;
  hs_language: string;
  subscribeOneOnOne: boolean;
  subscribeNews: boolean;
  amount: number;
  actionId?: number;
}
