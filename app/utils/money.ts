const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

/** "₦8,500", or "Free" for giveaways. Empty string when there's no price yet. */
export const formatNaira = (price?: number | null, isFree?: boolean) => {
  if (isFree) return "Free";
  if (price === undefined || price === null || Number.isNaN(price)) return "";
  return naira.format(price);
};
