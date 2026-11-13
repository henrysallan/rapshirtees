import { getStripe } from "@/lib/stripe";
import { product, sizeValue } from "@/product.config";

/**
 * The Buy button posts here. We create a Stripe Checkout Session and
 * redirect the browser to Stripe's hosted payment page. Size and shipping
 * address are collected on that page.
 */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const isLocal = /localhost|127\.0\.0\.1/.test(origin);

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
            name: product.name,
            // Stripe fetches this image itself, so it must be a public URL.
            images: isLocal ? undefined : [`${origin}${product.image.src}`],
          },
        },
      },
    ],
    custom_fields: [
      {
        key: "size",
        label: { type: "custom", custom: "Size" },
        type: "dropdown",
        dropdown: {
          options: product.sizes.map((s) => ({
            label: s.label,
            value: sizeValue(s.label),
          })),
        },
      },
    ],
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
