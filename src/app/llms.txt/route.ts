import { CATEGORY_KEYS, CATEGORY_PAGES } from "@/lib/content/category-pages";
import { GUIDES } from "@/lib/content/guides";
import { SHOP_DESCRIPTION, SHOP_URL, STORE_DESCRIPTION, STORE_URL } from "@/lib/seo";

/**
 * llms.txt: a plain summary for AI assistants and answer engines (ChatGPT, Perplexity, Gemini),
 * so they describe FastChina accurately and link to the right pages.
 */
export function GET() {
  const body = `# FastChina

> ${SHOP_DESCRIPTION}

FastChina is a Nigerian platform for buying from China. Prices are in Naira and already include international shipping and customs clearing (₦1,800 per kg). Orders are delivered free to Jumia pickup stations.

Key facts:
- Air delivery: about 10–18 days. Big items (furniture, machines) ship by sea: 90 days or more.
- Payment: in full, Pay small small (weekly over 4, 8 or 12 weeks, 0% interest) or Group pay.
- Wholesale: 10 or more of one item gets the retailer price automatically.
- Midnight Drop: lower prices every night from 12am to 4am (Lagos time).
- Every order is photographed at our China warehouse before it ships.
- Dropshipping: ${STORE_DESCRIPTION} Plans: Free (₦0, 20 products, up to ₦2,000,000 in sales), Pro (₦15,000/month), Elite (₦45,000/month).

## Shop
- [Marketplace](${SHOP_URL}/): products from 1688 factories in Naira
- [Wholesale market](${SHOP_URL}/wholesale): retailer prices from 10 units, sea freight for your own goods
${CATEGORY_KEYS.map((k) => `- [${CATEGORY_PAGES[k].name}](${SHOP_URL}/category/${k}): ${CATEGORY_PAGES[k].description}`).join("\n")}

## Sell
- [Start a free dropshipping store](${STORE_URL}/)

## Guides
${GUIDES.map((g) => `- [${g.h1}](${SHOP_URL}/guides/${g.slug}): ${g.summary}`).join("\n")}

## Policies
- [Terms](${SHOP_URL}/legal/terms)
- [Refunds](${SHOP_URL}/legal/refunds)
- [Privacy](${SHOP_URL}/legal/privacy)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
