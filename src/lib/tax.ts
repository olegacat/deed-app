/** Client-side tax display types — computation runs on Supabase Edge Functions. */

export interface TaxLine {
  label: string;
  basis: string;
  amount: number;
}

export interface PackageDoc {
  name: string;
  required: boolean;
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

export const formatUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
