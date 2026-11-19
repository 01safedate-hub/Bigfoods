/** Plain-language guides. Short steps; each names the screen and the button. */

export type Role = "super_admin" | "finance" | "purchasing" | "warehouse" | "customer_care" | "marketing";

export interface Guide { role: Role; title: string; job: string; steps: { do: string; how: string; href?: string }[]; tips: string[] }

export const FLOW = [
  { n: "1", t: "Customer pays", d: "The order shows under “Still to buy”." },
  { n: "2", t: "Buy", d: "Record what you bought + fees. Goods are now expected and given to customers, oldest payment first." },
  { n: "3", t: "Goods arrive", d: "Mark arrived. Orders with every item here become complete." },
  { n: "4", t: "Send", d: "Pick complete orders by state and date, enter Jumia’s price, mark sent. Stock goes down." },
  { n: "5", t: "Not collected?", d: "Record it with the refund. Goods go back to stock and to the next customer." },
  { n: "6", t: "Accounts", d: "Profit counts real landed costs, shipping out, refunds and every expense." },
];

export const GUIDES: Guide[] = [
  {
    role: "purchasing", title: "Purchasing", job: "You buy what customers paid for, and record it so goods are tracked to each customer.",
    steps: [
      { do: "Open Purchasing & dispatch → 1 · Buy", how: "The list shows every product paid customers are waiting for, and how many are still to buy.", href: "/admin/purchasing?tab=buy" },
      { do: "Add the products you bought", how: "Press “Add to purchase” on each row (or “Buy everything on this list”). Bought something not on the list? Search for it in the box." },
      { do: "Enter quantity and price per unit", how: "Type the price in naira, or press “from ¥” to convert the yuan price." },
      { do: "Add the extra fees", how: "Freight, customs/clearing, agent fee… Each fee is spread over the goods, so every unit carries its real cost." },
      { do: "Fill supplier, air/sea, date, then Save purchase", how: "You’ll see how many units went to how many orders, and how many are spare." },
    ],
    tips: ["Bought more than needed? The extra stays as spare stock and goes to the next customer who pays for it.", "Made a mistake? Ask a super admin; purchases aren’t edited after saving so the books stay honest."],
  },
  {
    role: "warehouse", title: "Warehouse & dispatch", job: "You receive goods, send complete orders out with Jumia, and record anything that comes back.",
    steps: [
      { do: "Goods landed? 2 · Expected goods → Mark arrived", how: "If fewer (or more) came than were bought, change the number before you confirm.", href: "/admin/purchasing?tab=expected" },
      { do: "3 · Ready to send", how: "Filter by state and payment date. “Complete” means every unit of the order is here.", href: "/admin/purchasing?tab=send" },
      { do: "Tick the orders you’re sending", how: "Enter what Jumia charged for each (or one price for all) and the tracking number." },
      { do: "Add any extra cost, then Mark as sent", how: "Transport to the hub, packing… The total is booked as shipping cost. Stock goes down and customers are told." },
      { do: "Customer didn’t pick up? Not collected", how: "Enter the order code, the refund and any return fee. Tick “put back in stock” if you have the goods.", href: "/admin/purchasing?tab=returns" },
    ],
    tips: ["Orders still waiting show what’s missing: “not bought” (tell purchasing) or “on the way”.", "Stock tab: what’s here, what’s promised to customers, and what’s spare."],
  },
  {
    role: "finance", title: "Finance", job: "You keep the books right and know the real profit.",
    steps: [
      { do: "Open Accounts and pick a period", how: "This month, last month, last 30 days, or any dates.", href: "/admin/accounts" },
      { do: "Read the profit & loss", how: "Sales − refunds − real goods cost − sellers’ share − shipping out − other expenses = profit." },
      { do: "Add running costs", how: "Rent, salaries, ads, packaging, bank charges: “Add an expense”. Purchase fees, Jumia and return fees come in by themselves." },
      { do: "Check “Refunds still to pay”", how: "Guest refunds waiting for a bank transfer. Customers with accounts are refunded to their wallet automatically." },
      { do: "Watch stock value", how: "Money sitting on the shelf. High and rising means buying ahead of sales." },
    ],
    tips: ["“Goods cost (estimated)” means some sold units aren’t bought yet: it becomes real once purchasing records them.", "Only hand-entered expenses can be removed."],
  },
  {
    role: "customer_care", title: "Customer care", job: "You answer customers and fix problems with their orders.",
    steps: [
      { do: "Find an order", how: "Orders → search by order code or phone number.", href: "/admin/orders" },
      { do: "Explain where it is", how: "Paid → Buying → Bought → At warehouse → Shipped → Delivered. Purchasing & dispatch shows exactly which item is missing." },
      { do: "Cancel before it’s sent", how: "Orders → Cancel. Money goes back once, automatically." },
      { do: "Not collected or sent back", how: "Purchasing & dispatch → Not collected. Record the refund; goods can go back in stock.", href: "/admin/purchasing?tab=returns" },
      { do: "Answer questions and reviews", how: "Q&A inbox and Reviews.", href: "/admin/questions" },
    ],
    tips: ["Never promise a date earlier than the order page shows.", "Refunds for guests are paid by finance; tell the customer to expect a transfer."],
  },
  {
    role: "marketing", title: "Marketing", job: "You bring customers in and keep the shop fresh.",
    steps: [
      { do: "Products", how: "Add or pause products, check photos and prices.", href: "/admin/products" },
      { do: "Coupons, events & stations", how: "Run sales and coupons with end dates.", href: "/admin/settings" },
      { do: "Q&A and reviews", how: "Fast answers sell. Publish real photo reviews.", href: "/admin/questions" },
      { do: "Emails & notifications", how: "See what customers were sent, and retry failures.", href: "/admin/emails" },
    ],
    tips: ["Check Accounts with finance before a big discount: the profit guard pauses offers that lose money."],
  },
  {
    role: "super_admin", title: "Owner (super admin)", job: "You see everything, set roles and check the business is healthy.",
    steps: [
      { do: "Give each person a role", how: "Staff & roles. Each role sees only the screens it needs.", href: "/admin/staff" },
      { do: "Every morning: Dashboard", how: "Sales, orders waiting, plans at risk, questions.", href: "/admin" },
      { do: "Every day: Purchasing & dispatch", how: "Nothing should sit in “Still to buy” or “Ready to send” for long.", href: "/admin/purchasing" },
      { do: "Every week: Accounts", how: "Profit, stock value, refunds to pay.", href: "/admin/accounts" },
      { do: "Share these guides", how: "Send new staff to Admin → Guide; their role’s guide is first." },
    ],
    tips: ["Read each role’s guide once: it’s the fastest way to see how the whole flow fits together."],
  },
];

/** Short card at the top of a screen. */
export const PAGE_TIPS: Record<string, { title: string; steps: string[]; more: string }> = {
  purchasing: {
    title: "How this screen works",
    steps: [
      "1 · Buy: add what you bought, how many, the price and any fees. Goods go to customers automatically.",
      "2 · Expected goods: when goods land, press Mark arrived.",
      "3 · Ready to send: filter by state and date, tick complete orders, enter Jumia’s price, Mark as sent.",
      "Not collected: record the refund and put the goods back in stock.",
    ],
    more: "/admin/guide#warehouse",
  },
  accounts: {
    title: "How profit is worked out",
    steps: [
      "Sales are orders fully paid in the period, minus refunds.",
      "Goods cost is the real landed cost: price plus its share of freight, customs and agent fees.",
      "Jumia costs and return fees come in from dispatch and returns. Add rent, salaries, ads etc. yourself.",
    ],
    more: "/admin/guide#finance",
  },
  orders: {
    title: "Order statuses",
    steps: ["Paid → Buying → Bought → At warehouse (complete) → Shipped → Delivered.", "To see what’s missing for an order, use Purchasing & dispatch → Ready to send → “Still waiting”."],
    more: "/admin/guide#customer_care",
  },
};
