export interface Donation {
  id: number;
  site_id: number;
  action_id?: number;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  anonymous: boolean;
  contact_details_type: string;
  email: string;
  newsletter: boolean;
  device_type: string;
  locale: string;
  frequency_type: string;
  currency: string;
  amount: string;
  transaction_costs: string;
  start_donation: boolean;
  registration_fee: boolean;
  registration_fee_amount: string;
  company_registration_fee: boolean;
  total_amount: string;
  receivable_amount: string;
  countable: boolean;
  invoicenumber: string;
  payment_method: string;
  payment_status: string;
  payment_status_at: string;
  transaction_id: string;
  payment_id: string;
  payment_description: string;
  target_url: string;
  address: Address;
  consent: any;
  consents: any[];
}

export interface Address {
  address: string;
  street: string;
  house_number: string;
  zipcode: string;
  city: string;
  country: string;
}

export function getDonation(apiKey: string, id: number): Promise<Donation> {
  return fetch(`https://api.kentaa.nl/v1/donations/${id}`, {
    headers: {
      "X-Api-Key": apiKey,
    },
  })
    .then((res) => res.json())
    .then((data: unknown): Donation => {
      if (typeof data === "object" && data !== null && "donation" in data) {
        return data.donation as Donation;
      }
      throw new Error("Invalid response format");
    });
}
