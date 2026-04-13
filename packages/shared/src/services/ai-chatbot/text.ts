const MOJIBAKE_HINT_PATTERN = /[ÃÂÄÆáºá»]/;
const VIETNAMESE_CHAR_PATTERN =
  /[ăâđêôơưĂÂĐÊÔƠƯàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/g;
const REPLACEMENT_CHAR_PATTERN = /\uFFFD/g;

function scoreVietnameseText(input: string) {
  const vietnameseCharCount = input.match(VIETNAMESE_CHAR_PATTERN)?.length ?? 0;
  const mojibakeHintCount = input.match(MOJIBAKE_HINT_PATTERN)?.length ?? 0;
  const replacementCharCount = input.match(REPLACEMENT_CHAR_PATTERN)?.length ?? 0;

  return vietnameseCharCount * 2 - mojibakeHintCount * 3 - replacementCharCount * 4;
}

export function repairPotentialMojibake(input: string) {
  if (!input || !MOJIBAKE_HINT_PATTERN.test(input)) return input;

  try {
    const bytes = Uint8Array.from(Array.from(input, (char) => char.charCodeAt(0) & 0xff));
    const repaired = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

    if (!repaired || repaired.includes("\u0000") || repaired.includes("\uFFFD")) {
      return input;
    }

    return scoreVietnameseText(repaired) >= scoreVietnameseText(input) ? repaired : input;
  } catch {
    return input;
  }
}

export function normalizeVietnameseText(input: string) {
  return repairPotentialMojibake(input)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}
