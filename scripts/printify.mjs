// Looks up the Printify IDs you need for product.config.ts and .env.local.
//
//   npm run printify                 → list your shops (→ PRINTIFY_SHOP_ID)
//   npm run printify                 → with PRINTIFY_SHOP_ID set: list products
//   npm run printify <productId>     → list that product's variants + a `sizes` snippet

const token = process.env.PRINTIFY_API_TOKEN;
const shopId = process.env.PRINTIFY_SHOP_ID;
const productId = process.argv[2];

if (!token) {
  console.error("Set PRINTIFY_API_TOKEN in .env.local first.");
  process.exit(1);
}

async function get(path) {
  const res = await fetch(`https://api.printify.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "rapshirtees-store",
    },
  });
  if (!res.ok) {
    console.error(`Printify ${res.status} on ${path}:`, await res.text());
    process.exit(1);
  }
  return res.json();
}

if (!shopId) {
  const shops = await get("/shops.json");
  console.log("Your Printify shops — put one id in .env.local as PRINTIFY_SHOP_ID:\n");
  for (const s of shops) console.log(`  ${s.id}\t${s.title}\t(${s.sales_channel})`);
  process.exit(0);
}

if (!productId) {
  const { data } = await get(`/shops/${shopId}/products.json?limit=50`);
  console.log(`Products in shop ${shopId} — run \`npm run printify <id>\` for one:\n`);
  for (const p of data) console.log(`  ${p.id}\t${p.title}`);
  process.exit(0);
}

const p = await get(`/shops/${shopId}/products/${productId}.json`);
const enabled = p.variants.filter((v) => v.is_enabled);
console.log(`${p.title}\n`);
console.log("  variant id\tyour cost\ttitle");
for (const v of enabled) {
  console.log(`  ${v.id}\t$${(v.cost / 100).toFixed(2)}\t\t${v.title}`);
}

const SIZE = /^(XXS|XS|S|M|L|XL|[2-6]XL)$/i;
const sizeOf = (title) =>
  title.split("/").map((t) => t.trim()).find((t) => SIZE.test(t)) ?? title;
const labels = enabled.map((v) => sizeOf(v.title));
const unique = new Set(labels).size === labels.length;

console.log("\nPaste into product.config.ts:\n");
console.log(`  printifyProductId: "${p.id}",`);
console.log("  sizes: [");
enabled.forEach((v, i) => {
  const label = unique ? labels[i] : v.title;
  console.log(`    { label: ${JSON.stringify(label)}, printifyVariantId: ${v.id} },`);
});
console.log("  ],");
if (!unique) {
  console.log("\n(Several colours are enabled, so labels include the colour — trim to the one you sell.)");
}
