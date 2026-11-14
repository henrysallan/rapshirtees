import shirtImage from "./public/rari-01.jpg";

/**
 * Everything about the one product this store sells.
 * Nothing in here is secret — API keys live in .env.local.
 */
export const product = {
  name: "Blood Rain Rari Shirt",

  // Product photo — change the import at the top to use a different file.
  image: shirtImage,

  // Price charged in Stripe, in the smallest currency unit (3500 = $35.00).
  // Printify charges you $9.68 per shirt (S–XL) for this product.
  price: 3500,
  currency: "usd",

  // Shipping charged in Stripe Checkout (0 = free). Printify still bills you:
  // US standard is $5.35 for one shirt, +$2.40 for each extra shirt.
  shipping: { amount: 0, label: "Free shipping" },

  // Countries Stripe Checkout will accept a shipping address from.
  // Make sure your Printify print provider ships to all of them.
  shippingCountries: ["US"] as const,

  // Printify product "Retro Red Honda Racing Graphic T-Shirt" (Gildan 5000, white).
  printifyProductId: "6af7ad1ef341e569cc004091",

  // Size buttons on the page, each mapped to the Printify variant to order.
  // See all variants with `npm run printify <productId>`.
  sizes: [
    { label: "S", printifyVariantId: 12102 },
    { label: "M", printifyVariantId: 12101 },
    { label: "L", printifyVariantId: 12100 },
    { label: "XL", printifyVariantId: 12103 },
  ],

  // Max shirts per order (customer can adjust quantity in Checkout).
  maxQuantity: 5,
};

export function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
  }).format(amount / 100);
}
