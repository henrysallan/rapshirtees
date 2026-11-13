import shirtImage from "./public/shirt.png";

/**
 * Everything about the one product this store sells.
 * Nothing in here is secret — API keys live in .env.local.
 */
export const product = {
  name: "rapshirtees tee",

  // Swap public/shirt.png for your product photo (same filename),
  // or import a different file above.
  image: shirtImage,

  // Price charged in Stripe, in the smallest currency unit (3500 = $35.00).
  price: 3500,
  currency: "usd",

  // Flat shipping charged in Stripe Checkout. Printify bills you for real
  // shipping separately, so set this to roughly cover it (or 0 if the
  // price above already includes shipping).
  shipping: { amount: 500, label: "Standard shipping" },

  // Countries Stripe Checkout will accept a shipping address from.
  // Make sure your Printify print provider ships to all of them.
  shippingCountries: ["US"] as const,

  // Printify product ID (from the product URL in Printify, or `npm run printify`).
  printifyProductId: "REPLACE_WITH_PRINTIFY_PRODUCT_ID",

  // Sizes shown in the Stripe Checkout dropdown, each mapped to the Printify
  // variant to order. Get the variant IDs with `npm run printify <productId>`.
  sizes: [
    { label: "S", printifyVariantId: 0 },
    { label: "M", printifyVariantId: 0 },
    { label: "L", printifyVariantId: 0 },
    { label: "XL", printifyVariantId: 0 },
    { label: "2XL", printifyVariantId: 0 },
  ],

  // Max shirts per order (customer can adjust quantity in Checkout).
  maxQuantity: 5,
};

/** Stripe dropdown option values must be alphanumeric. */
export function sizeValue(label: string) {
  return label.replace(/[^a-zA-Z0-9]/g, "");
}

export function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
  }).format(amount / 100);
}
