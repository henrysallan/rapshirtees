const BASE_URL = "https://api.printify.com/v1";

export type PrintifyAddress = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string; // ISO 3166-1 alpha-2, e.g. "US"
  region: string; // state / province
  address1: string;
  address2?: string;
  city: string;
  zip: string;
};

export type PrintifyOrderInput = {
  external_id: string;
  label?: string;
  line_items: { product_id: string; variant_id: number; quantity: number }[];
  shipping_method: number; // 1 standard, 2 priority, 3 express, 4 economy
  send_shipping_notification: boolean;
  address_to: PrintifyAddress;
};

export class PrintifyError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Printify API ${status}: ${JSON.stringify(body)}`);
  }
}

async function printify<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) throw new Error("PRINTIFY_API_TOKEN is not set");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json;charset=utf-8",
      "User-Agent": "rapshirtees-store",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new PrintifyError(res.status, body);
  return body as T;
}

function shopId() {
  const id = process.env.PRINTIFY_SHOP_ID;
  if (!id) throw new Error("PRINTIFY_SHOP_ID is not set");
  return id;
}

/**
 * Creates an order for an existing Printify product.
 * Printify rejects a second order with the same external_id (HTTP 409), which
 * we use to make Stripe webhook retries safe: returns `created: false` then.
 */
export async function createOrder(
  order: PrintifyOrderInput,
): Promise<{ id: string; created: boolean }> {
  try {
    const { id } = await printify<{ id: string }>(
      `/shops/${shopId()}/orders.json`,
      { method: "POST", body: JSON.stringify(order) },
    );
    return { id, created: true };
  } catch (err) {
    if (err instanceof PrintifyError && err.status === 409) {
      const existing = (err.body as { order?: { id?: string } })?.order?.id;
      return { id: existing ?? "unknown", created: false };
    }
    throw err;
  }
}

/** Skips the shop's approval window and starts printing right away. */
export async function sendToProduction(orderId: string) {
  await printify(`/shops/${shopId()}/orders/${orderId}/send_to_production.json`, {
    method: "POST",
  });
}
