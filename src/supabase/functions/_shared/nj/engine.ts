/** NJ document rules + tax engine — ported from deed-copilot-prototype src/nj.js */

export interface NjDoc {
  code: string;
  category: string;
  status: "REQUIRED" | "CONDITIONAL";
  review: "STANDARD" | "ATTORNEY" | "TAX";
  reason: string;
  source: string | null;
}

export interface NjTaxLine {
  name: string;
  basis: string;
  amount: number;
  detail?: string;
}

export interface NjTaxResult {
  lines: NjTaxLine[];
  total: number;
}

export interface NjDocInput {
  nominal: boolean;
  consideration: number;
  grantorIsResident: boolean;
}

export interface NjParcelFacts {
  county: string;
  propertyClass: string;
}

const RTF_FORMS = "https://www.nj.gov/treasury/taxation/realtytransfevaluetree.shtml";

export function njRTF(consideration: number) {
  const bands: Array<[number, number]> = [
    [150_000, 2.0],
    [200_000, 3.35],
    [350_000, 3.9],
    [550_000, 4.8],
    [850_000, 5.3],
    [1_000_000, 5.8],
    [Infinity, 6.05],
  ];
  let prev = 0;
  let fee = 0;
  for (const [cap, rate] of bands) {
    const amt = Math.max(0, Math.min(consideration, cap) - prev);
    if (amt > 0) fee += Math.ceil(amt / 500) * rate;
    prev = cap;
    if (consideration <= cap) break;
  }
  return Math.round(fee);
}

const isMansionClass = (pc: string) => ["2", "3A", "4A"].includes(String(pc || "").toUpperCase().trim());

export function njGraduatedFeeRate(amount: number) {
  if (amount <= 1_000_000) return 0;
  if (amount <= 2_000_000) return 0.01;
  if (amount <= 2_500_000) return 0.02;
  if (amount <= 3_000_000) return 0.025;
  if (amount <= 3_500_000) return 0.03;
  return 0.035;
}

export function determineNJDocuments(input: NjDocInput, parcel: NjParcelFacts): NjDoc[] {
  const hasConsideration = !input.nominal && input.consideration > 0;
  const nonresident = !input.grantorIsResident;
  const amount = input.consideration || 0;
  const docs: NjDoc[] = [];

  docs.push({
    code: "DEED",
    category: "Deed",
    status: "REQUIRED",
    review: "STANDARD",
    reason: "Every recorded conveyance requires a deed.",
    source: null,
  });
  docs.push({
    code: `${parcel.county} Cover Sheet`,
    category: "County cover sheet",
    status: "REQUIRED",
    review: "STANDARD",
    reason: `${parcel.county} County cover sheet / electronic synopsis (statewide requirement).`,
    source: "https://www.nj.gov/treasury/taxation/lpt/rtffaqs.shtml",
  });
  docs.push({
    code: "RTF",
    category: "Transfer fee",
    status: "REQUIRED",
    review: "STANDARD",
    reason: "NJ Realty Transfer Fee, calculated on consideration unless exempt.",
    source: RTF_FORMS,
  });

  if (!hasConsideration) {
    docs.push({
      code: "RTF-1",
      category: "Exemption affidavit",
      status: "REQUIRED",
      review: "ATTORNEY",
      reason:
        "Affidavit of Consideration for Use by Seller — required when claiming an RTF exemption/partial exemption.",
      source: RTF_FORMS,
    });
  }

  if (amount > 1_000_000 || String(parcel.propertyClass || "").startsWith("4")) {
    docs.push({
      code: "RTF-1EE",
      category: "Exemption affidavit",
      status: "REQUIRED",
      review: "ATTORNEY",
      reason:
        "Affidavit of Consideration for the Graduated Percent Fee — consideration over $1M and every commercial (Class 4) transfer.",
      source: RTF_FORMS,
    });
  }

  if (nonresident) {
    docs.push({
      code: "GIT/REP-1",
      category: "Nonresident withholding",
      status: "CONDITIONAL",
      review: "TAX",
      reason:
        "Nonresident seller: GIT/REP-1 estimated gross income tax payment (unless a waiver/exemption applies).",
      source: RTF_FORMS,
    });
  } else {
    docs.push({
      code: "GIT/REP-3",
      category: "Nonresident withholding",
      status: "REQUIRED",
      review: "STANDARD",
      reason: "Resident seller (or exemption applies): GIT/REP-3 Seller's Residency Certification/Exemption.",
      source: RTF_FORMS,
    });
  }

  return docs;
}

export function calculateNJTax(input: NjDocInput, parcel: NjParcelFacts): NjTaxResult {
  const lines: NjTaxLine[] = [];
  const hasConsideration = !input.nominal && input.consideration > 0;
  const amount = input.consideration || 0;

  if (!hasConsideration) {
    lines.push({
      name: "NJ Realty Transfer Fee",
      basis: "No / nominal consideration",
      amount: 0,
      detail: "Exemption subject to attorney confirmation (RTF-1).",
    });
    return { lines, total: 0 };
  }

  const rtf = njRTF(amount);
  lines.push({
    name: "NJ Realty Transfer Fee",
    basis: `Standard RTF schedule on $${amount.toLocaleString()}`,
    amount: rtf,
    detail: "Seller (grantor).",
  });

  const gpRate = njGraduatedFeeRate(amount);
  if (gpRate > 0 && isMansionClass(parcel.propertyClass)) {
    lines.push({
      name: "NJ Graduated Percent Fee",
      basis: `${(gpRate * 100).toFixed(gpRate * 100 % 1 ? 1 : 0)}% of $${amount.toLocaleString()} (over $1M)`,
      amount: Math.round(amount * gpRate),
      detail: "Seller (grantor) as of 7/10/2025. Rate is graduated on the entire consideration.",
    });
  }

  const total = lines.reduce((s, l) => s + l.amount, 0);
  return { lines, total };
}
