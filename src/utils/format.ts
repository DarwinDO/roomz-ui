/**
 * Format a VND price value into millions with a compact suffix.
 *
 * Example:
 *  - 3_500_000  -> "3.5"
 *  - 2_000_000  -> "2"
 */
export function formatPriceInMillions(
  price: number,
  fractionDigits = 1,
): string {
  if (!Number.isFinite(price)) {
    return "";
  }

  const valueInMillions = price / 1_000_000;
  const formatted = valueInMillions.toFixed(fractionDigits);

  // Drop trailing ".0" (or multiple zeros) but keep other decimals.
  return formatted.replace(/\.0+$/, "");
}
