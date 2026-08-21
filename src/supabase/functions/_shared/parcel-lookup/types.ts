/** Normalized parcel record from a public open-data source. */
export interface ParcelRecord {
  state: string;
  number: string;
  street: string;
  town: string;
  county: string;
  owner: string;
  ownerFull: string;
  ownerFromDeed?: boolean;
  propertyClass: string;
  propertyClassDesc: string;
  residential: boolean;
  assessmentTotal: number;
  marketValue: number;
  parcelNumber: string;
  /** NJ block/lot (when available from MOD-IV). */
  block?: string;
  lot?: string;
  qual?: string;
  sbl: string;
  legalDescription: string | null;
  deedBook: string | null;
  deedPage: string | null;
  deedDate?: string | null;
  acres?: number;
  schoolDistrict?: string;
  schoolCode?: string;
  dataProvider: string;
  sourceUrl?: string;
  mailing?: {
    line: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface ParcelLookupInput {
  stateCode: string;
  county: string;
  city: string;
  house: string;
  street: string;
}
