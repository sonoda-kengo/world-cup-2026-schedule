const specialFlags: Record<string, string> = {
  "GB-ENG": subdivisionFlag("gbeng"),
  "GB-SCT": subdivisionFlag("gbsct"),
};

function subdivisionFlag(tag: string): string {
  const base = String.fromCodePoint(0x1f3f4);
  const cancel = String.fromCodePoint(0xe007f);
  const tags = [...tag].map((char) => String.fromCodePoint(0xe0000 + char.charCodeAt(0)));

  return `${base}${tags.join("")}${cancel}`;
}

export function flagEmoji(code: string | null): string {
  if (!code) return "";
  if (specialFlags[code]) return specialFlags[code];

  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}
