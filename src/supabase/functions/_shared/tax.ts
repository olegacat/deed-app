const STATE_NAMES: Record<string, string> = {
  NY: "New York",
  NYC: "New York City",
  NJ: "New Jersey",
  CT: "Connecticut",
  PA: "Pennsylvania",
  FL: "Florida",
  NC: "North Carolina",
  MA: "Massachusetts",
  MD: "Maryland",
  WA: "Washington",
  MN: "Minnesota",
};

function stateName(code: string): string {
  return STATE_NAMES[code] ?? code;
}

export interface TaxLine {
  label: string;
  basis: string;
  amount: number;
}

export interface PackageDoc {
  name: string;
  required: boolean; // false => AUTO-ADDED
  note?: string;
}

export interface TaxResult {
  verified: boolean;
  authority: string;
  lines: TaxLine[];
  total: number;
  docs: PackageDoc[];
  flags: string[];
  formulaCopy: string;
}

export interface TaxInput {
  stateCode: string;
  county: string;
  consideration: number;
  nominal: boolean;
  singleFamily: boolean;
}

const money = (n: number) => Math.round(n * 100) / 100;
const per = (amount: number, unit: number, rate: number) => money(Math.ceil(amount / unit) * rate);

const NC_LTT_COUNTIES = ["Camden", "Chowan", "Currituck", "Dare", "Pasquotank", "Perquimans", "Washington"];

function nyMansion(c: number) {
  if (c < 1_000_000) return 0;
  if (c < 2_000_000) return money(c * 0.01);
  if (c < 3_000_000) return money(c * 0.0125);
  if (c < 5_000_000) return money(c * 0.015);
  if (c < 10_000_000) return money(c * 0.0225);
  if (c < 15_000_000) return money(c * 0.0325);
  if (c < 20_000_000) return money(c * 0.035);
  if (c < 25_000_000) return money(c * 0.0375);
  return money(c * 0.039);
}

function njRtf(c: number) {
  // Simplified standard (non-exempt) NJ Realty Transfer Fee schedule.
  let fee = 0;
  const tiers: Array<[number, number]> = [
    [150_000, 0.004],
    [200_000, 0.0067],
    [350_000, 0.0083],
    [550_000, 0.0098],
    [850_000, 0.0114],
    [1_000_000, 0.0119],
    [Infinity, 0.0121],
  ];
  let prev = 0;
  for (const [cap, rate] of tiers) {
    if (c <= prev) break;
    fee += (Math.min(c, cap) - prev) * rate;
    prev = cap;
  }
  return money(fee);
}

function ctConveyance(c: number) {
  const stateTax =
    c <= 800_000
      ? c * 0.0075
      : c <= 2_500_000
        ? 800_000 * 0.0075 + (c - 800_000) * 0.0125
        : 800_000 * 0.0075 + 1_700_000 * 0.0125 + (c - 2_500_000) * 0.0225;
  return money(stateTax);
}

function waReet(c: number) {
  let tax = 0;
  const tiers: Array<[number, number]> = [
    [525_000, 0.011],
    [1_525_000, 0.0128],
    [3_025_000, 0.0275],
    [Infinity, 0.03],
  ];
  let prev = 0;
  for (const [cap, rate] of tiers) {
    if (c <= prev) break;
    tax += (Math.min(c, cap) - prev) * rate;
    prev = cap;
  }
  return money(tax);
}

export function computeTax(input: TaxInput): TaxResult {
  const { stateCode, county, consideration, nominal, singleFamily } = input;
  const c = nominal ? 0 : Math.max(0, consideration || 0);
  const name = stateName(stateCode);
  const lines: TaxLine[] = [];
  const docs: PackageDoc[] = [];
  const flags: string[] = [];
  let verified = true;
  let authority = `${name} recording authority`;
  let formulaCopy = "";

  const deedDoc: PackageDoc = { name: "DEED", required: true };
  docs.push(deedDoc);

  switch (stateCode) {
    case "NY": {
      authority = `${county || "County"} County Clerk`;
      const rett = per(c, 500, 2);
      lines.push({ label: "NYS Real Estate Transfer Tax", basis: "$2.00 per $500 of consideration", amount: rett });
      docs.push({ name: "TP-584 (Combined RETT / Credit Line Mortgage)", required: true });
      docs.push({ name: "RP-5217 (Real Property Transfer Report)", required: true });
      if (["Suffolk", "Nassau"].includes(county)) {
        docs.push({ name: "Peconic Bay Region CPF form", required: false, note: "East End towns only" });
        flags.push("Suffolk East End towns levy a 2%–3% Peconic Bay CPF transfer tax above an exemption floor — confirm the town before recording.");
      }
      if (county === "Suffolk") docs.push({ name: "Suffolk County Rental & Environment (R&E) form", required: false });
      const mansion = singleFamily ? nyMansion(c) : 0;
      if (mansion > 0) {
        lines.push({ label: "NYS Mansion Tax (residential)", basis: "graduated 1.0%–3.9% at $1M+", amount: mansion });
        flags.push("Consideration is $1M or more on residential property — the mansion tax applies and is paid by the buyer.");
      }
      docs.push({ name: "IT-2663 (nonresident estimated tax)", required: false, note: "Nonresident grantor only" });
      formulaCopy = "NYS RETT is $2.00 per $500 (or fraction) of consideration; residential conveyances at $1M+ add the graduated mansion tax.";
      break;
    }
    case "NYC": {
      authority = "NYC Dept. of Finance · ACRIS";
      const rptt = singleFamily
        ? c <= 500_000
          ? c * 0.01
          : c * 0.01425
        : c <= 500_000
          ? c * 0.01425
          : c * 0.02625;
      lines.push({
        label: "NYC Real Property Transfer Tax (RPTT)",
        basis: singleFamily ? "1.0% ≤ $500k / 1.425% above" : "1.425% ≤ $500k / 2.625% above",
        amount: money(rptt),
      });
      lines.push({ label: "NYS Real Estate Transfer Tax", basis: "$2.00 per $500 of consideration", amount: per(c, 500, 2) });
      const mansion = singleFamily ? nyMansion(c) : 0;
      if (mansion > 0) {
        lines.push({ label: "NYS Mansion Tax (residential)", basis: "graduated 1.0%–3.9% at $1M+", amount: mansion });
        flags.push("NYC residential conveyance at $1M+ — graduated mansion tax applies on top of RPTT.");
      }
      docs.push({ name: "NYC-RPT (filed via ACRIS)", required: true });
      docs.push({ name: "TP-584", required: true });
      docs.push({ name: "RP-5217NYC", required: true });
      docs.push({ name: "Smoke Detector Affidavit", required: false, note: "1–2 family dwellings" });
      formulaCopy = "NYC RPTT plus NYS RETT are both due; residential rates are 1.0%/1.425% and commercial 1.425%/2.625% at the $500k break.";
      break;
    }
    case "NJ": {
      authority = `${county || "County"} County Clerk / Register`;
      const rtf = njRtf(c);
      lines.push({ label: "Realty Transfer Fee", basis: "graduated 0.40%–1.21%", amount: rtf });
      if (c > 1_000_000 && singleFamily) {
        lines.push({ label: '"Mansion" fee (buyer)', basis: "1% of consideration over $1M, Class 2 residential", amount: money(c * 0.01) });
        flags.push("Class 2 residential over $1M — the 1% buyer's fee applies in addition to the seller's RTF.");
      }
      docs.push({ name: "RTF-1 (Seller's Affidavit of Consideration)", required: true });
      docs.push({ name: "RTF-1EE (Buyer's Affidavit)", required: false, note: "Required over $1M or on exemption claims" });
      docs.push({ name: "GIT/REP-3 (Seller's Residency Certification)", required: true });
      formulaCopy = "NJ Realty Transfer Fee is graduated from 0.40% to 1.21%; the buyer's 1% supplemental fee applies to Class 2 residential over $1M.";
      break;
    }
    case "CT": {
      authority = `${county || "Town"} Town Clerk`;
      lines.push({ label: "State conveyance tax", basis: "0.75% ≤ $800k, 1.25% to $2.5M, 2.25% above", amount: ctConveyance(c) });
      lines.push({ label: "Municipal conveyance tax", basis: "0.25% base rate (targeted towns up to 0.50%)", amount: money(c * 0.0025) });
      docs.push({ name: "Form OP-236 (CT Real Estate Conveyance Tax Return)", required: true });
      if (c > 2_500_000) flags.push("Residential consideration above $2.5M — the 2.25% top tier applies to the excess portion only.");
      formulaCopy = "CT conveyance tax = state tiers (0.75% / 1.25% / 2.25%) plus the municipal rate; OP-236 is filed with the town clerk.";
      break;
    }
    case "PA": {
      authority = `${county || "County"} County Recorder of Deeds`;
      const localRate = county === "Philadelphia" ? 0.03278 : county === "Allegheny" ? 0.02 : 0.01;
      lines.push({ label: "PA state realty transfer tax", basis: "1% of consideration", amount: money(c * 0.01) });
      lines.push({
        label: `Local realty transfer tax (${county || "municipality"})`,
        basis: county === "Philadelphia" ? "Philadelphia 3.278%" : county === "Allegheny" ? "typical Allegheny 2.0%" : "typical 1% (municipality + school district)",
        amount: money(c * localRate),
      });
      docs.push({ name: "REV-183 (Statement of Value)", required: false, note: "Required for gifts / no stated consideration" });
      docs.push({ name: "REV-715 (Realty Transfer Tax Declaration)", required: false });
      if (nominal) flags.push("No stated consideration — PA requires a REV-183 Statement of Value and tax may be assessed on computed value.");
      if (county === "Philadelphia") flags.push("Philadelphia's combined rate is 4.278% and tax is computed on assessed value × common level ratio when higher.");
      formulaCopy = "PA charges 1% state realty transfer tax plus a local rate (1% typical, 3.278% in Philadelphia).";
      break;
    }
    case "FL": {
      authority = `${county || "County"} Clerk of Court`;
      const rate = county === "Miami-Dade" ? 0.006 : 0.007;
      lines.push({
        label: "Documentary stamp tax on the deed",
        basis: county === "Miami-Dade" ? "$0.60 per $100 (Miami-Dade)" : "$0.70 per $100",
        amount: per(c, 100, county === "Miami-Dade" ? 0.6 : 0.7),
      });
      if (county === "Miami-Dade" && !singleFamily) {
        lines.push({ label: "Miami-Dade surtax", basis: "$0.45 per $100 (non-single-family)", amount: per(c, 100, 0.45) });
        docs.push({ name: "Miami-Dade surtax computation", required: false, note: "Auto-added: non-single-family" });
        flags.push("Miami-Dade non-single-family conveyance — the $0.45/$100 surtax applies on top of the $0.60 stamp rate.");
      }
      void rate;
      docs.push({ name: "Recording cover / Clerk transmittal", required: false });
      if (nominal) flags.push("Nominal consideration in Florida still incurs the minimum $0.70 documentary stamp; gifts of mortgaged property are taxed on the debt.");
      formulaCopy = "Florida documentary stamps are $0.70 per $100 of consideration statewide ($0.60 in Miami-Dade, plus a $0.45/$100 surtax on non-single-family).";
      break;
    }
    case "NC": {
      authority = `${county || "County"} Register of Deeds`;
      lines.push({ label: "Excise tax on conveyance", basis: "$1.00 per $500 of consideration", amount: per(c, 500, 1) });
      if (NC_LTT_COUNTIES.includes(county)) {
        lines.push({ label: `${county} County Land Transfer Tax`, basis: "up to 1% of consideration", amount: money(c * 0.01) });
        docs.push({ name: `${county} Land Transfer Tax form`, required: false, note: "Auto-added: LTT county" });
        flags.push(`${county} County levies a local Land Transfer Tax of up to 1% in addition to the state excise tax.`);
      }
      docs.push({ name: "Recording cover sheet", required: false });
      formulaCopy = "NC excise tax is $1.00 per $500 (or fraction) of consideration; seven coastal counties add a local Land Transfer Tax.";
      break;
    }
    case "MA": {
      authority = `${county || "Registry"} Registry of Deeds`;
      const isBarnstable = county === "Barnstable";
      lines.push({
        label: "Deeds excise",
        basis: isBarnstable ? "$3.42 per $500 (Barnstable, 0.648%)" : "$2.28 per $500 (0.456%)",
        amount: per(c, 500, isBarnstable ? 3.42 : 2.28),
      });
      if (isBarnstable) {
        lines.push({ label: "Cape Cod Land Bank fee", basis: "typically 0% at deed; check town CPA surcharge", amount: 0 });
        flags.push("Barnstable County uses the higher deeds excise rate and several towns add a land bank / CPA surcharge.");
      }
      docs.push({ name: "Registry recording cover sheet", required: true });
      formulaCopy = "Massachusetts deeds excise is $2.28 per $500 (0.456%); Barnstable County is $3.42 per $500 (0.648%).";
      break;
    }
    case "MD": {
      authority = `${county || "Jurisdiction"} Clerk of the Circuit Court`;
      lines.push({ label: "State transfer tax", basis: "0.5% of consideration", amount: money(c * 0.005) });
      lines.push({ label: "County transfer tax", basis: "typical 1.0% (varies by jurisdiction)", amount: money(c * 0.01) });
      lines.push({ label: "Recordation tax", basis: "typical $5.00 per $500 (varies by jurisdiction)", amount: per(c, 500, 5) });
      docs.push({ name: "Maryland Intake Sheet", required: true });
      docs.push({ name: "Affidavit of Residency / Non-residency withholding", required: false });
      flags.push("County transfer and recordation rates vary widely in Maryland — confirm the rate for this jurisdiction before recording.");
      if (singleFamily) flags.push("If a grantee is a first-time Maryland homebuyer, state transfer tax drops to 0.25% and is payable by the seller.");
      formulaCopy = "Maryland stacks a 0.5% state transfer tax, a county transfer tax and recordation tax charged per $500 of consideration.";
      break;
    }
    case "WA": {
      authority = `${county || "County"} Treasurer`;
      lines.push({ label: "State REET", basis: "graduated 1.10% / 1.28% / 2.75% / 3.00%", amount: waReet(c) });
      lines.push({ label: "Local REET", basis: "typical 0.50% (city/county option)", amount: money(c * 0.005) });
      docs.push({ name: "REET-1 Real Estate Excise Tax Affidavit", required: true });
      docs.push({ name: "Excise tax receipt / Treasurer stamp", required: false });
      if (nominal) flags.push("Gift or nominal-consideration transfers in Washington still require a REET affidavit with the exemption code (WAC 458-61A).");
      formulaCopy = "Washington REET is graduated: 1.10% to $525k, 1.28% to $1.525M, 2.75% to $3.025M, 3.00% above — plus the local rate.";
      break;
    }
    case "MN": {
      authority = `${county || "County"} Recorder / Registrar of Titles`;
      const erf = county === "Hennepin" || county === "Ramsey";
      lines.push({ label: "State deed tax", basis: "0.33% of consideration", amount: money(c * 0.0033) });
      if (erf) {
        lines.push({ label: "Environmental Response Fund tax", basis: "0.01% (Hennepin / Ramsey)", amount: money(c * 0.0001) });
        docs.push({ name: "ERF tax computation", required: false, note: "Auto-added: Hennepin / Ramsey" });
      }
      docs.push({ name: "eCRV (Certificate of Real Estate Value)", required: c > 3000, note: "Required over $3,000" });
      docs.push({ name: "Well Disclosure Certificate", required: false });
      if (nominal) flags.push("Minnesota charges a minimum $1.65 deed tax on gift/nominal deeds; eCRV is still required over $3,000.");
      formulaCopy = "Minnesota deed tax is 0.33% of consideration (0.34% effective in Hennepin and Ramsey with the ERF tax).";
      break;
    }
    default: {
      verified = false;
      authority = `${stateName(stateCode)} county recording office`;
      lines.push({ label: "Estimated transfer / recording tax", basis: "research-grade rate — not yet rate-verified", amount: money(c * 0.005) });
      docs.push({ name: "State transfer tax declaration (generic)", required: true });
      flags.push(`${name} is a beta jurisdiction: the rate above is research-grade and has not been verified against the state's official schedule.`);
      formulaCopy = `${name} runs on the generic transfer-tax engine. The deed generator is complete, but the rate is research-grade until verification lands.`;
    }
  }

  const total = money(lines.reduce((s, l) => s + l.amount, 0));
  return { verified, authority, lines, total, docs, flags, formulaCopy };
}

export const formatUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });