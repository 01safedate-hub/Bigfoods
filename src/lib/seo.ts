/**
 * Search: one place for our addresses, brand facts and structured data (schema.org JSON-LD),
 * so every page describes FastChina to Google the same way.
 */

export const SHOP_URL = "https://fastchina.shop";
export const STORE_URL = "https://fastchina.store";
export const BRAND = "FastChina";

/** The words people actually type. Used in page copy and metadata, never stuffed. */
export const SHOP_DESCRIPTION =
  "Buy from China in Nigeria at 1688 factory prices in Naira. Free shipping to your Jumia pickup station, Pay small small and wholesale prices from 10 units.";
export const STORE_DESCRIPTION =
  "Start a dropshipping store in Nigeria for free. No stock, no upfront cost: pick products from China, set your price, and we deliver to your customers.";

export const RETURN_DAYS = 7;
/** Air delivery: handling 1–3 days, transit 10–18 days (see Terms → Delivery). */
export const AIR_DAYS = { handling: [1, 3], transit: [10, 18] } as const;

type Json = Record<string, unknown>;

/** Safe to drop into <script type="application/ld+json">: closes no tags early. */
export const ldJson = (data: Json | Json[]) => JSON.stringify(data).replace(/</g, "\\u003c");

export function organization(): Json {
  return {
    "@type": "Organization",
    "@id": `${SHOP_URL}/#org`,
    name: BRAND,
    url: SHOP_URL,
    logo: `${SHOP_URL}/icon-512.png`,
    description: SHOP_DESCRIPTION,
    areaServed: { "@type": "Country", name: "Nigeria" },
    sameAs: [STORE_URL],
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", areaServed: "NG", availableLanguage: ["en"] },
  };
}

export function website(): Json {
  return {
    "@type": "WebSite",
    "@id": `${SHOP_URL}/#website`,
    url: SHOP_URL,
    name: BRAND,
    inLanguage: "en-NG",
    publisher: { "@id": `${SHOP_URL}/#org` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SHOP_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbs(items: [name: string, path: string][], base = SHOP_URL): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${base}${path}` })),
  };
}

export function faq(items: { q: string; a: string }[]): Json {
  return {
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/** Free delivery to a pickup station anywhere in Nigeria, by air. */
export function shippingDetails(): Json {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "NGN" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "NG" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: AIR_DAYS.handling[0], maxValue: AIR_DAYS.handling[1], unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: AIR_DAYS.transit[0], maxValue: AIR_DAYS.transit[1], unitCode: "DAY" },
    },
  };
}

export function returnPolicy(): Json {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "NG",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: RETURN_DAYS,
    returnMethod: "https://schema.org/ReturnInStore",
    returnFees: "https://schema.org/FreeReturn",
  };
}

export const graph = (...nodes: Json[]): Json => ({ "@context": "https://schema.org", "@graph": nodes });

/** Trims a description to Google's snippet length without cutting a word in half. */
export function snippet(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", max - 1))}…`;
}
