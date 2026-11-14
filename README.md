# rapshirtees

A one-product T-shirt store. Customers pay with Stripe Checkout, and a Stripe webhook turns each paid order into a Printify order.

```
Buy button ──POST──▶ /api/checkout ──303──▶ Stripe Checkout (size, quantity, address, card)
                                                      │
                               checkout.session.completed (signed webhook)
                                                      ▼
                                         /api/webhooks/stripe ──▶ Printify: create order
                                                                        │
                                                         approve / send_to_production
                                                                        ▼
                                                              printed & shipped
```

| File | What it does |
| --- | --- |
| `product.config.ts` | Name, price, shipping, countries, sizes → Printify variant IDs |
| `public/shirt.png` | Product image (placeholder — replace it) |
| `app/page.tsx` | The page: centred image, Buy button bottom-left |
| `app/api/checkout/route.ts` | Creates the Stripe Checkout Session |
| `app/api/webhooks/stripe/route.ts` | Verifies Stripe's signature, creates the Printify order |
| `lib/printify.ts` | Small Printify API client |
| `scripts/printify.mjs` | Prints your Printify shop, product and variant IDs |

## Connecting Stripe to Printify

### 1. Prerequisites in Printify

- **Billing:** Printify charges *you* (production + shipping) for every order. Add a card or balance in Printify, or orders get stuck at `payment-not-received`.
- **API token:** My profile → Connections → generate a personal access token with `shops.read`, `products.read`, `orders.read`, `orders.write`. Tokens last one year.
- **Order approval:** new Printify stores auto-approve orders after 24 hours. That gives you a window to cancel. You can switch the store to manual approval, or set `PRINTIFY_SEND_TO_PRODUCTION=true` to skip the wait (see step 6).

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `STRIPE_SECRET_KEY` (start with the `sk_test_…` key) and `PRINTIFY_API_TOKEN`.

### 3. Get the Printify IDs

```bash
npm run printify            # lists shops → copy the id into PRINTIFY_SHOP_ID
npm run printify            # now lists products in that shop
npm run printify <productId>  # lists variants + a ready-to-paste `sizes` block
```

Paste `printifyProductId` and `sizes` into `product.config.ts`. While you're there, set `price` and `shipping` so they cover the Printify cost the script prints, plus Stripe's fee.

### 4. Test locally (Stripe test mode)

Install the [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
brew install stripe/stripe-cli/stripe
```

If Homebrew complains about Command Line Tools, download the `mac-os` binary from the [stripe-cli releases](https://github.com/stripe/stripe-cli/releases) instead.

Then forward Stripe's events to your machine. This uses the `STRIPE_SECRET_KEY` from `.env.local`, so it always listens to the same test environment the site uses. No `stripe login` is needed:

```bash
npm run stripe:listen
```

Copy the `whsec_…` it prints into `STRIPE_WEBHOOK_SECRET` (it stays the same between runs), then in another terminal:

```bash
npm run dev
```

Open http://localhost:3000, click Buy, and pay with card `4242 4242 4242 4242` (any future date, any CVC). The dev server should log `Created Printify order …`.

> **Printify has no sandbox.** Even with Stripe in test mode, the order you just made is a real Printify order. Cancel it in Printify → Orders before it's approved. Or switch the store to manual approval while you test.

### 5. Deploy

1. Import this repo into Vercel (or any Node host).
2. Add the env vars from `.env.example` in the project settings. Use the live Stripe key when you're ready to sell.
3. In Stripe Dashboard → Developers → Webhooks, add an endpoint:
   - URL: `https://<your-domain>/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
4. Copy that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.

Test mode and live mode have separate keys **and** separate webhook endpoints and secrets.

### 6. Go-live checklist

- [ ] `public/shirt.png` replaced and `product.config.ts` filled in (no `printifyVariantId: 0` left)
- [ ] Live `STRIPE_SECRET_KEY` and the live endpoint's `STRIPE_WEBHOOK_SECRET` set in production
- [ ] Stripe → Settings → Customer emails → "Successful payments" turned on, so buyers get a receipt
- [ ] `shippingCountries` only lists countries your Printify print provider ships to
- [ ] Decide on `PRINTIFY_SEND_TO_PRODUCTION`:
  - `false` (default): orders follow the store's approval setting.
  - `true`: orders are printed immediately after payment.

## How the webhook behaves

- Only paid sessions are fulfilled. Delayed payment methods are fulfilled on `checkout.session.async_payment_succeeded`.
- The Stripe session ID is sent to Printify as `external_id`. Printify rejects a duplicate with HTTP 409, so Stripe's retries never create a second order.
- If Printify is down or a size has no variant ID, the webhook returns 500. Stripe then retries for up to 3 days. Fix the problem and the next retry goes through. You can also resend the event from the Stripe dashboard.
- Customers get Stripe's receipt. Shipping and tracking emails aren't wired up yet. Printify's `order:shipment:created` webhook is the hook for that.
