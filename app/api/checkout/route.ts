import { getStripe } from "@/lib/stripe";
import { product } from "@/product.config";

/**
 * The Buy button posts here with the chosen size. We create a Stripe Checkout
 * Session and redirect the browser to Stripe's hosted payment page, which
 * collects quantity, shipping address and payment.
 */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const isLocal = /localhost|127\.0\.0\.1/.test(origin);

  const form = await request.formData();
  const size = product.sizes.find((s) => s.label === form.get("size"));
  if (!size) {
    return Response.redirect(`${origin}/`, 303);
  }

  // Read by the Stripe webhook to place the matching Printify order.
  const metadata = {
    size: size.label,
    printify_product_id: product.printifyProductId,
    printify_variant_id: String(size.printifyVariantId),
  };

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
          maximum: product.maxQuantity,
        },
        price_data: {
          currency: product.currency,
          unit_amount: product.price,
          product_data: {
            name: `${product.name} — ${size.label}`,
            // Stripe fetches this image itself, so it must be a public URL.
            images: isLocal ? undefined : [`${origin}${product.image.src}`],
          },
        },
      },
    ],
    metadata,
    payment_intent_data: { metadata },
    shipping_address_collection: {
      allowed_countries: [...product.shippingCountries],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: product.shipping.label,
          fixed_amount: {
            amount: product.shipping.amount,
            currency: product.currency,
          },
        },
      },
    ],
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
  });

  if (!session.url) {
    return new Response("Could not start checkout", { status: 500 });
  }
  return Response.redirect(session.url, 303);
}
