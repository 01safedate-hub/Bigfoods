/** Plain-language explainers shown behind every ⓘ button. */
export type InfoKey = "midnight" | "coupons" | "flash" | "clearout" | "retailer" | "shipping" | "pay" | "group" | "points" | "smallsmall";

export interface InfoContent {
  title: string;
  intro: string;
  points: string[];
  fine: string;
}

export const INFO: Record<InfoKey, InfoContent> = {
  midnight: {
    title: "How Midnight Drop works",
    intro: "Every night from 12:00am to 4:00am (Lagos time), every price on FastChina drops by itself.",
    points: [
      "We cut our own profit on every item by 20%. There’s no code and nothing to claim. The lower price just shows.",
      "Order and pay before 4:00am to keep the midnight price. Bank transfers started before 4:00am get 15 extra minutes to confirm.",
      "You can still use one coupon on top. Flash and retailer (10+) prices don’t stack with it. You always get whichever price is lower.",
      "Tap “Remind me” and we’ll notify you at 11:55pm.",
    ],
    fine: "The discount comes out of our margin, never the product cost, which is why we can run it every night.",
  },
  coupons: {
    title: "How coupons work",
    intro: "Claim coupons here. At checkout we apply the one that saves you the most.",
    points: [
      "One coupon per order.",
      "Minimum spend counts eligible items only. Phones, laptops, desktops and drones have their own gadget coupons because their margin is small.",
      "Coupons don’t work with retailer (10+) prices.",
      "Claimed coupons expire after 7 days.",
    ],
    fine: "If a coupon can’t be used on your cart, checkout tells you exactly why.",
  },
  flash: {
    title: "How Flash Sale works",
    intro: "A limited number of items at their lowest price, until the timer runs out.",
    points: [
      "Flash prices take up to half of our profit off the normal price.",
      "Stock is limited. When the bar is full the deal ends, even if time is left.",
      "Limit 2 per customer per item.",
      "Flash and Midnight Drop prices don’t add together. You get whichever is lower.",
    ],
    fine: "Every flash item is still sold above what it costs us.",
  },
  clearout: {
    title: "How Cart Clear-Out works",
    intro: "Every Friday at 8pm we pick random carts and pay for them.",
    points: [
      "Sign in and keep at least ₦20,000 of items in your cart for 24 hours before 8pm on Friday. That’s your entry. It’s free and you don’t have to buy anything.",
      "Up to 5 winners a week. A winning cart is paid in full as wallet credit, so you can check out straight away.",
      "It’s provably fair: on Monday we publish a locked code (a fingerprint of a secret number). On Friday we reveal the number, and anyone can check that it matches and re-run the draw.",
      "One entry per person. FastChina staff and their families can’t win.",
    ],
    fine: "The weekly prize pool comes from last week’s profit, so the draw is always funded.",
  },
  retailer: {
    title: "How retailer prices work",
    intro: "Buying to resell? Buy 10 or more of one product and pay retailer prices.",
    points: [
      "Mix colours and sizes of the same product to reach 10 pieces.",
      "Retailer prices are up to 40% off our margin, shown per piece.",
      "Coupons, Midnight Drop and flash prices don’t apply on top. Retailer price is already our best price.",
      "Retailer orders ship like any other order and can use Pay small small or Group pay.",
    ],
    fine: "Want your own branded online shop? See Dropship Stores on fastchina.store.",
  },
  shipping: {
    title: "How delivery works",
    intro: "Shipping to your Jumia pickup station is always free, and customs clearing is included in the price.",
    points: [
      "Air items take about 10–18 days from order to your pickup station.",
      "Big items such as furniture and machines go by sea only, about 90+ days.",
      "We photograph your item in our China warehouse before it ships. See the photos under My orders.",
      "When it reaches your station you get an SMS with a pickup code. Bring the code and an ID.",
    ],
    fine: "If your order never reaches the pickup station, you get a full refund.",
  },
  pay: {
    title: "Ways to pay",
    intro: "Pay all at once, little by little, or with help from friends and family.",
    points: [
      "Pay in full with card, bank transfer, USSD or your FastChina wallet.",
      "Pay small small: split the price over 4, 8 or 12 weeks with 0% interest. The price is locked when you start. We order from the factory after your last payment, so delivery time starts then.",
      "Missed a payment? You have 3 days. After 14 days the plan is cancelled and everything you paid goes to your wallet.",
      "Group pay: pay part (or nothing), share a link, and anyone can chip in. Fully paid items can ship straight away.",
    ],
    fine: "There’s no interest because we only buy from the factory once an item is fully paid. It isn’t a loan.",
  },
  smallsmall: {
    title: "How Pay small small works",
    intro: "Spread the price over weekly payments with 0% interest.",
    points: [
      "Choose 4, 8 or 12 weeks (orders from ₦10,000; each weekly payment is at least ₦2,000). The first payment is today and the price is locked.",
      "We remind you before each payment. Pay by card, transfer or USSD.",
      "We order from the factory once the last payment clears, then normal delivery time applies.",
      "Missed a payment? You have 3 days. After 14 days the plan is cancelled and what you paid goes to your wallet.",
    ],
    fine: "No interest, no credit check. We only buy the item once it’s fully paid.",
  },
  group: {
    title: "How Group pay works",
    intro: "Share a link so friends and family can help pay for an order.",
    points: [
      "Pay what you can now, even ₦0, and share your link on WhatsApp or anywhere else.",
      "Anyone can chip in with card, transfer or USSD. They don’t need an account.",
      "Money pays for items from the top of the list down, and you can reorder them anytime. A fully paid item can ship straight away.",
      "A link can’t be over-paid: if someone sends more than what’s left, the extra goes straight back to them.",
      "The link stays open for 7 days. Items fully paid by then still ship. Money that didn’t complete an item goes back to the people who paid it, split fairly by how much each gave.",
    ],
    fine: "Contributors see the item names and the total, never the phone number or pickup address. If the order is cancelled, everyone is refunded.",
  },
  points: {
    title: "How points work",
    intro: "100 points = ₦100 off.",
    points: [
      "Earn points from daily check-ins (+5 a day, +30 on day 7), 1 point per ₦100 spent, +100 for verifying your email, +20 for a photo review and +500 when a friend you invited places a first order.",
      "At checkout, switch on “Use points”. Points can pay up to 10% of an order.",
      "Points from an order arrive once it’s delivered.",
      "Points expire 12 months after you earn them.",
    ],
    fine: "Your check-in streak restarts if you miss a day.",
  },
};
