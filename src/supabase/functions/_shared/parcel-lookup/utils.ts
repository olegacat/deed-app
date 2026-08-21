export const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const titleCase = (s: string) =>
  String(s || "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();

export const esc = (s: string) => String(s || "").replace(/'/g, "''");

const STREET_SUFFIXES = new Set([
  "st",
  "street",
  "rd",
  "road",
  "ln",
  "lane",
  "la",
  "dr",
  "drive",
  "ave",
  "av",
  "avenue",
  "ct",
  "court",
  "pl",
  "place",
  "blvd",
  "boulevard",
  "ter",
  "terr",
  "terrace",
  "way",
  "cir",
  "circle",
  "hwy",
  "highway",
  "pkwy",
  "parkway",
  "trl",
  "trail",
  "sq",
  "square",
  "loop",
  "row",
  "path",
  "walk",
  "plz",
  "plaza",
  "tpke",
  "turnpike",
]);

/** Strip suffixes and leading house numbers for fuzzy street matching. */
export function baseStreet(street: string, stripOrdinals = false): string {
  let words = String(street)
    .trim()
    .replace(/[.,]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length && /^\d/.test(words[0]!)) words = words.slice(1);
  if (stripOrdinals) {
    words = words.map((w) => w.replace(/^(\d+)(st|nd|rd|th)$/i, "$1"));
  }
  if (words.length > 1 && STREET_SUFFIXES.has(words[words.length - 1]!.toLowerCase())) {
    words = words.slice(0, -1);
  }
  return words.join(" ");
}

export function splitAddress(addr: string) {
  const s = String(addr || "").trim();
  const m = s.match(/^(\d+[A-Za-z-]?)\s+(.*)$/);
  return m ? { number: m[1]!, street: m[2]! } : { number: "", street: s };
}

export function dedupeByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const id = keyFn(item);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}
