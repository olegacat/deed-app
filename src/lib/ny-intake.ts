/** TP-584 intake options — ported from deed-copilot-prototype scenario.js */

export const NY_TP584_CONDITIONS = [
  { code: "a", label: "a — Conveyance of fee interest" },
  { code: "b", label: "b — Acquisition of a controlling interest" },
  { code: "c", label: "c — Transfer of a controlling interest" },
  { code: "d", label: "d — Conveyance to cooperative housing corp." },
  { code: "e", label: "e — Conveyance in lieu of / pursuant to foreclosure" },
  { code: "f", label: "f — Mere change of identity or form of ownership" },
  { code: "g", label: "g — Credit for tax previously paid will be claimed" },
  { code: "h", label: "h — Conveyance of cooperative apartment(s)" },
  { code: "i", label: "i — Syndication" },
  { code: "j", label: "j — Conveyance of air / development rights" },
  { code: "k", label: "k — Contract assignment" },
  { code: "l", label: "l — Option assignment or surrender" },
  { code: "m", label: "m — Leasehold assignment or surrender" },
  { code: "n", label: "n — Leasehold grant" },
  { code: "o", label: "o — Conveyance of an easement" },
  { code: "p", label: "p — Exemption from transfer tax claimed" },
  { code: "q", label: "q — Property partly within and outside the state" },
  { code: "r", label: "r — Conveyance pursuant to divorce or separation" },
  { code: "s", label: "s — Other" },
] as const;

export const NY_TP584_EXEMPTIONS = [
  { code: "a", label: "a — To government or instrumentality" },
  { code: "b", label: "b — To secure a debt or obligation" },
  { code: "c", label: "c — Confirm / correct a prior conveyance" },
  { code: "d", label: "d — Without consideration / bona fide gift" },
  { code: "e", label: "e — In connection with a tax sale" },
  { code: "f", label: "f — Mere change of identity or form of ownership" },
  { code: "g", label: "g — Deed of partition" },
  { code: "h", label: "h — Pursuant to the Bankruptcy Act" },
  { code: "i", label: "i — Contract to sell (no use/occupancy)" },
  { code: "j", label: "j — Option/contract with use, under $200k" },
  { code: "k", label: "k — Not a conveyance under §1401(e)" },
  { code: "l", label: "l — Open space / historic preservation" },
] as const;

export const NY_GRANTEE_TYPES = [
  "Individual",
  "Corporation",
  "Partnership",
  "Estate / Trust",
  "Single-member LLC",
  "Multi-member LLC",
  "Other",
] as const;
