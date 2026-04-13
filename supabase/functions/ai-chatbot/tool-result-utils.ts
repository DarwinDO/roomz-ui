export type ToolResultRecord<TToolName extends string = string> = {
  name: TToolName;
  result: unknown;
};

/**
 * Cap repeated tool calls with the same signature within a single assistant turn.
 * Prevents the tool-loop failure mode where the model repeatedly invokes the same
 * tool with identical arguments, flooding the assistant message with duplicates.
 *
 * @param calls - Ordered list of tool calls for the turn.
 * @param maxPerSignature - Max allowed calls with the same signature (default: 2).
 * @param getSignature - Extracts a comparable key from a call item.
 */
export function capToolCalls<T>(
  calls: T[],
  maxPerSignature: number,
  getSignature: (call: T) => string,
): T[] {
  const counts = new Map<string, number>();
  const result: T[] = [];

  for (const call of calls) {
    const sig = getSignature(call);
    const count = counts.get(sig) ?? 0;
    if (count >= maxPerSignature) continue;
    counts.set(sig, count + 1);
    result.push(call);
  }

  return result;
}

function serializeToolResult(result: ToolResultRecord) {
  try {
    return `${result.name}:${JSON.stringify(result.result)}`;
  } catch {
    return `${result.name}:${String(result.result)}`;
  }
}

export function dedupeToolResults<T extends ToolResultRecord>(results: T[]) {
  const seen = new Set<string>();
  const uniqueResults: T[] = [];

  for (const result of results) {
    const signature = serializeToolResult(result);
    if (seen.has(signature)) {
      continue;
    }

    seen.add(signature);
    uniqueResults.push(result);
  }

  return uniqueResults;
}
