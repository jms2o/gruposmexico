export const stripEmojis = (value: string): string =>
  value
    .replace(/(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\u200D|\uFE0F)/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

export const stripEmojisDeep = <T>(input: T): T => {
  if (typeof input === "string") return stripEmojis(input) as T;
  if (Array.isArray(input)) return input.map((item) => stripEmojisDeep(item)) as T;
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = stripEmojisDeep(value);
    }
    return result as T;
  }
  return input;
};
