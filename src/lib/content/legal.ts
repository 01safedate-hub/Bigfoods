/**
 * Legal pages. DRAFTS written from how the site works today. Have a Nigerian lawyer review
 * them before launch, and fill in the company details marked [ ].
 */
export interface LegalDoc {
  title: string;
  summary: string;
  sections: { h: string; p: string[] }[];
}

const COMPANY = "FastChina ([REGISTERED COMPANY NAME], RC [CAC NUMBER])";

export const LEGAL: Record<string, LegalDoc> = {
  terms: {
    title: "Terms of use",
    summary: "The rules for buying on FastChina.",
    sections: [
      { h: "Who we are", p: [`${COMPANY} buys products from manufacturers in China and delivers them to Jumia pickup stations in Nigeria. These terms apply to fastchina.shop and fastchina.store.`] },
      { h: "Prices", p: ["Prices are in naira and include shipping to your pickup station and customs clearing. The price is fixed when you place your order, including on Pay small small.", "Promotions (Midnight Drop, events, flash sales, retailer prices, coupons and points) never add together. You get the lowest single price, and coupon and points limits shown at checkout apply."] },
      { h: "Paying", p: ["Pay in full, Pay small small (weekly, 0% interest) or Group pay. We only buy your item from the factory once it is fully paid.", "Pay small small: a payment is late after 3 days. If money is still overdue 14 days after a due date, the plan is cancelled and everything paid goes to your FastChina wallet.", "Group pay: links stay open 7 days. Items fully paid by then still ship. Money that didn’t complete an item goes back to the people who paid it, in proportion to what each gave."] },
      { h: "Delivery", p: ["Air items usually take 10–18 days from full payment; sea items (furniture, machines and big items) 90 days or more. These are estimates, not guarantees.", "We deliver only to Jumia pickup stations. Bring your pickup code and an ID. An order is marked delivered 10 days after it leaves us."] },
      { h: "Cancelling", p: ["You can cancel any time before we buy your item from the factory, and get your money back to your wallet. After we have bought it, the order can’t be cancelled."] },
      { h: "Accounts", p: ["You sign in with a one-time code sent to your email or phone. Keep access to them secure. We may suspend accounts used for fraud or abuse of promotions."] },
      { h: "Liability", p: ["Nothing in these terms limits your rights under the Federal Competition and Consumer Protection Act 2018. Contact [SUPPORT EMAIL / PHONE] with any complaint."] },
    ],
  },
  privacy: {
    title: "Privacy policy",
    summary: "What we collect, why, and your rights under the Nigeria Data Protection Act 2023.",
    sections: [
      { h: "Who controls your data", p: [`${COMPANY}. Data protection contact: [DPO EMAIL].`] },
      { h: "What we collect", p: ["Your email or phone number (to sign in and send order updates), your pickup station, your orders and payments, your saved items and points, and questions you ask about products.", "We don’t store card numbers. Payments are handled by licensed payment processors."] },
      { h: "Why", p: ["To fulfil your orders (contract), to prevent fraud and keep promotions fair (legitimate interest), and to send marketing only if you agree (consent, which you can withdraw any time)."] },
      { h: "Who sees it", p: ["Our staff, only as their role needs; Jumia, to deliver to your station; payment processors; and our hosting and SMS providers. Group pay contributors see item names and totals, never your phone number or address. We never sell your data."] },
      { h: "Where it’s stored", p: ["Our database is hosted by Supabase in the European Union, with safeguards for transfers out of Nigeria as the Act requires."] },
      { h: "Cookies and storage on your device", p: [
        "We use one essential cookie to keep you signed in. We don’t use advertising or tracking cookies, so there’s no cookie banner.",
        "Your cart, saved items and a few display settings are kept in your browser’s storage so they work without signing in and when you’re offline. Clearing your browser data removes them.",
        "If you add FastChina to your home screen, your phone keeps copies of public pages (like product pages) so they open without a connection. Account and checkout pages are never stored.",
      ] },
      { h: "Emails and notifications", p: [
        "Order, payment and refund emails are part of the service. Offer emails (like Midnight Drop alerts) are only sent if you switch them on, and every one has an unsubscribe link.",
        "If an email bounces or is reported as spam, we stop emailing that address. To protect against abuse we count requests per connection using a one-way scrambled (hashed) form of your IP address, kept for 2 days.",
      ] },
      { h: "How long", p: [
        "Order and payment records: as long as tax and accounting law requires, then deleted.",
        "Notifications: read ones after 90 days, all after a year. Email contents and addresses in our send log: after 180 days.",
        "Everything else: until you delete your account.",
      ] },
      { h: "Your rights", p: [
        "Download everything we hold about you, or delete your account, any time from My account → Your data and privacy.",
        "You can also ask us to correct your data or object to how we use it by writing to [DPO EMAIL]. We reply within 30 days. You can complain to the Nigeria Data Protection Commission at any time.",
      ] },
    ],
  },
  refunds: {
    title: "Refunds",
    summary: "When you get your money back, and how.",
    sections: [
      { h: "Never arrived", p: ["If your order never reaches your pickup station, you get a full refund."] },
      { h: "Wrong or damaged item", p: ["If we send the wrong item or it arrives damaged, report it from your account within 7 days of collecting it, with a photo. We refund it in full or send a replacement, your choice. Returns are dropped at your Jumia pickup station at no cost to you."] },
      { h: "Cancelled before we buy", p: ["Cancel any time before we buy from the factory and get everything you paid back."] },
      { h: "Plans and group links", p: ["A cancelled Pay small small plan returns everything paid to your wallet. Group pay leftovers go back to the people who paid them."] },
      { h: "How refunds are paid", p: ["Signed-in customers get wallet credit straight away, usable at checkout. Guests and anyone who prefers it are paid back to the original payment method within [X] working days."] },
    ],
  },
  "draw-rules": {
    title: "Cart Clear-Out rules",
    summary: "How the Friday draw works and how to check it was fair.",
    sections: [
      { h: "Who can enter", p: ["Signed-in customers aged 18 or over with at least ₦20,000 of items in their cart for 24 hours before 8pm (Lagos time) on Friday. Entry is free; no purchase is needed. One entry per person. Staff and their families can’t win."] },
      { h: "Prizes", p: ["Up to 5 winners a week. A winner’s cart total is paid as FastChina wallet credit. The weekly prize pool is 5% of the previous week’s profit, up to ₦500,000, and may be zero."] },
      { h: "How winners are picked", p: ["On Monday we publish a fingerprint (SHA-256) of a secret number. On Friday we reveal the number. Each entry’s ticket is the SHA-256 of the number, a colon and the entry ID; the lowest tickets win while their cart fits the prize pool left. Anyone can check the number matches Monday’s fingerprint and re-run the draw."] },
      { h: "Claiming", p: ["Winners are told by SMS and in their account. Prizes can’t be exchanged for cash."] },
    ],
  },
};
