const NON_DIGIT_REGEX = /\D+/g;

export function sanitizeCurrencyInput(value: string | number | null | undefined): string {
  return String(value ?? "").replace(NON_DIGIT_REGEX, "");
}

export function formatCurrencyInput(value: string | number | null | undefined): string {
  const digits = sanitizeCurrencyInput(value);

  if (!digits) {
    return "";
  }

  return Number(digits).toLocaleString("vi-VN");
}

export function parseCurrencyInput(value: string | number | null | undefined): number {
  const digits = sanitizeCurrencyInput(value);
  return digits ? Number(digits) : 0;
}
