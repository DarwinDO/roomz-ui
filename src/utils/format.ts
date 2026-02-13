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

/**
 * Format a monthly price in VND
 * Example: 3500000 -> "3.5 triệu/tháng"
 */
export function formatMonthlyPrice(price: number): string {
  if (!Number.isFinite(price)) {
    return "Liên hệ";
  }

  const valueInMillions = price / 1_000_000;

  if (valueInMillions >= 1) {
    const formatted = valueInMillions.toFixed(1).replace(/\.0$/, '');
    return `${formatted} triệu/tháng`;
  } else {
    return `${price.toLocaleString('vi-VN')}đ/tháng`;
  }
}

/**
 * Format a price range
 */
export function formatPriceRange(min: number, max: number): string {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return "Liên hệ";
  }
  return `${formatPriceInMillions(min)} - ${formatPriceInMillions(max)} triệu`;
}

/**
 * Format a VND currency value
 * Example: 3500000 -> "3.500.000₫"
 */
export const formatCurrency = (value: number): string =>
  `${value.toLocaleString("vi-VN")}₫`;
