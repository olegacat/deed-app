/** NJ package API response types (computation runs on Supabase Edge Functions). */

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

export interface NjReview {
  confirmed: string[];
  verify: string[];
  provide: string[];
  flags: string[];
}
