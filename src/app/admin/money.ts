/** Labels shared by the stock and accounts screens. */
export const EXPENSE_LABEL: Record<string, string> = {
  local_shipping: "Local shipping (Jumia etc.)", packaging: "Packaging", returns: "Return fees", marketing: "Marketing & ads", staff: "Staff & salaries",
  rent: "Rent & utilities", bank_charges: "Bank & payment charges", freight: "Freight (China → Nigeria)", clearing: "Customs & clearing", agent: "Agent fee", other: "Other",
};
export const EXPENSE_CATS = Object.keys(EXPENSE_LABEL);
export const FEE_CATS = ["freight", "clearing", "agent", "packaging", "local_shipping", "other"] as const;
export const REASON_LABEL: Record<string, string> = { not_collected: "Not collected", damaged: "Damaged", wrong_item: "Wrong item", other: "Other" };
