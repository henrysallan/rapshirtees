import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createOrder, sendToProduction } from "@/lib/printify";

/**
 * Stripe calls this after a customer pays. We turn the paid Checkout Session
 * into a Printify order.
 *
 * Returning a non-2xx status makes Stripe retry (for up to 3 days), so we only
 * do that for errors a retry could fix. Retries are safe: the Stripe session ID
 * is sent to Printify as external_id, and Printify refuses duplicates.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text(); // raw body — required for the signature check

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature ?? "", secret);
  } catch (err) {
    console.error("Stripe signature check failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    // Delayed payment methods complete first and pay later; we'll get
    // async_payment_succeeded for those.
    if (session.payment_status !== "paid") {
      return Response.json({ received: true, skipped: "not paid yet" });
    }
    // Anyone can "pay" a test-mode checkout with Stripe's public test cards,
    // and Printify has no sandbox — so test payments don't order by default.
    if (!event.livemode && process.env.PRINTIFY_ORDER_TEST_PAYMENTS !== "true") {
      console.log(`Test-mode payment ${session.id}: not ordering from Printify`);
      return Response.json({ received: true, skipped: "test mode" });
    }

    try {
      await fulfill(session.id);
    } catch (err) {
      console.error(`Fulfilment failed for ${session.id}:`, err);
      return new Response("Fulfilment failed", { status: 500 });
    }
  }

  return Response.json({ received: true });
}

async function fulfill(sessionId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });

  // Set by /api/checkout from the size the customer picked on the page.
  const productId = session.metadata?.printify_product_id;
  const variantId = Number(session.metadata?.printify_variant_id);
  if (!productId || !variantId) {
    throw new Error(`Session ${session.id} has no Printify product/variant in its metadata`);
  }

  const quantity = session.line_items?.data[0]?.quantity ?? 1;
  const shipping = session.collected_information?.shipping_details;
  const customer = session.customer_details;
  if (!shipping || !customer?.email) {
    throw new Error("Session is missing shipping address or email");
  }

  const [firstName, ...rest] = shipping.name.trim().split(/\s+/);
  const a = shipping.address;

  const order = await createOrder({
    external_id: session.id,
    label: `Stripe ${session.id.slice(-8)}`,
    line_items: [{ product_id: productId, variant_id: variantId, quantity }],
    shipping_method: Number(process.env.PRINTIFY_SHIPPING_METHOD ?? 1),
    send_shipping_notification: false,
    address_to: {
      first_name: firstName,
      last_name: rest.join(" ") || "-",
      email: customer.email,
      phone: customer.phone ?? undefined,
      country: a.country ?? "",
      region: a.state ?? "",
      address1: a.line1 ?? "",
      address2: a.line2 ?? undefined,
      city: a.city ?? "",
      zip: a.postal_code ?? "",
    },
  });

  if (!order.created) {
    console.log(`Printify order ${order.id} already exists for ${session.id}`);
    return;
  }
  console.log(`Created Printify order ${order.id} for ${session.id}`);

  if (process.env.PRINTIFY_SEND_TO_PRODUCTION === "true") {
    try {
      await sendToProduction(order.id);
      console.log(`Sent Printify order ${order.id} to production`);
    } catch (err) {
      // The order exists in Printify either way; don't make Stripe retry.
      console.error(
        `Order ${order.id} created but send_to_production failed — approve it in Printify:`,
        err,
      );
    }
  }
}
