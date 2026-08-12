export type StateStatus = "live" | "beta" | "coming-soon";

export interface StateInfo {
  code: string; // "NY", "NYC", "DC"...
  name: string;
  status: StateStatus;
  row: number;
  col: number;
  countyLabel: string; // "counties" | "parishes" | "boroughs" | "towns"
  counties: string[];
  card?: {
    badge: string; // "LIVE" or "LIVE · ACRIS"
    summary: string;
  };
  openDataUrl?: string;
  openDataLabel?: string;
  subtitle?: string; // header subtitle for wizard
  preparedByRequired?: boolean;
  recordingQuirk?: string;
}

// Rough US grid positions (row, col). NYC is placed as a satellite tile.
const g = (row: number, col: number) => ({ row, col });

export const STATES: StateInfo[] = [
  { code: "AK", name: "Alaska", status: "beta", ...g(1, 1), countyLabel: "boroughs", counties: ["Anchorage", "Fairbanks North Star", "Juneau", "Kenai Peninsula", "Matanuska-Susitna"] },
  { code: "ME", name: "Maine", status: "beta", ...g(1, 11), countyLabel: "counties", counties: ["Androscoggin","Aroostook","Cumberland","Franklin","Hancock","Kennebec","Knox","Lincoln","Oxford","Penobscot","Piscataquis","Sagadahoc","Somerset","Waldo","Washington","York"] },
  { code: "VT", name: "Vermont", status: "beta", ...g(2, 10), countyLabel: "counties", counties: ["Addison","Bennington","Caledonia","Chittenden","Essex","Franklin","Grand Isle","Lamoille","Orange","Orleans","Rutland","Washington","Windham","Windsor"] },
  { code: "NH", name: "New Hampshire", status: "beta", ...g(2, 11), countyLabel: "counties", counties: ["Belknap","Carroll","Cheshire","Coos","Grafton","Hillsborough","Merrimack","Rockingham","Strafford","Sullivan"] },
  { code: "WA", name: "Washington", status: "live", ...g(3, 1), countyLabel: "counties",
    counties: ["Adams","Asotin","Benton","Chelan","Clallam","Clark","Columbia","Cowlitz","Douglas","Ferry","Franklin","Garfield","Grant","Grays Harbor","Island","Jefferson","King","Kitsap","Kittitas","Klickitat","Lewis","Lincoln","Mason","Okanogan","Pacific","Pend Oreille","Pierce","San Juan","Skagit","Skamania","Snohomish","Spokane","Stevens","Thurston","Wahkiakum","Walla Walla","Whatcom","Whitman","Yakima"],
    card: { badge: "LIVE", summary: "39 counties · WA Dept. of Revenue REET tiers + local · statewide parcel data · REET-1 controlling-interest form" },
    openDataUrl: "https://geo.wa.gov/", openDataLabel: "geo.wa.gov",
    subtitle: "Washington · 39 counties · REET graduated 1.10–3.00%",
    recordingQuirk: "REET affidavit filed with county Treasurer at recording; controlling-interest transfers use REET-2."
  },
  { code: "ID", name: "Idaho", status: "beta", ...g(3, 2), countyLabel: "counties", counties: ["Ada","Bannock","Bonner","Canyon","Kootenai","Twin Falls"] },
  { code: "MT", name: "Montana", status: "beta", ...g(3, 3), countyLabel: "counties", counties: ["Cascade","Flathead","Gallatin","Lewis and Clark","Missoula","Yellowstone"] },
  { code: "ND", name: "North Dakota", status: "beta", ...g(3, 4), countyLabel: "counties", counties: ["Burleigh","Cass","Grand Forks","Ward"] },
  { code: "MN", name: "Minnesota", status: "live", ...g(3, 5), countyLabel: "counties",
    counties: ["Aitkin","Anoka","Becker","Beltrami","Benton","Big Stone","Blue Earth","Brown","Carlton","Carver","Cass","Chippewa","Chisago","Clay","Clearwater","Cook","Cottonwood","Crow Wing","Dakota","Dodge","Douglas","Faribault","Fillmore","Freeborn","Goodhue","Grant","Hennepin","Houston","Hubbard","Isanti","Itasca","Jackson","Kanabec","Kandiyohi","Kittson","Koochiching","Lac qui Parle","Lake","Lake of the Woods","Le Sueur","Lincoln","Lyon","Mahnomen","Marshall","Martin","McLeod","Meeker","Mille Lacs","Morrison","Mower","Murray","Nicollet","Nobles","Norman","Olmsted","Otter Tail","Pennington","Pine","Pipestone","Polk","Pope","Ramsey","Red Lake","Redwood","Renville","Rice","Rock","Roseau","Saint Louis","Scott","Sherburne","Sibley","Stearns","Steele","Stevens","Swift","Todd","Traverse","Wabasha","Wadena","Waseca","Washington","Watonwan","Wilkin","Winona","Wright","Yellow Medicine"],
    card: { badge: "LIVE", summary: "87 counties · state Deed Tax 0.33% (0.34% Hennepin/Ramsey ERF) · MnGeo parcel service · eCRV filing thresholds" },
    openDataUrl: "https://gisdata.mn.gov/", openDataLabel: "gisdata.mn.gov",
    subtitle: "Minnesota · 87 counties · Deed Tax 0.33% + eCRV",
    recordingQuirk: "eCRV required over $3,000; Hennepin & Ramsey add Environmental Response Fund tax (0.01%)."
  },
  { code: "WI", name: "Wisconsin", status: "beta", ...g(3, 6), countyLabel: "counties", counties: ["Brown","Dane","Kenosha","Milwaukee","Racine","Waukesha"] },
  { code: "MI", name: "Michigan", status: "beta", ...g(3, 7), countyLabel: "counties", counties: ["Genesee","Ingham","Kent","Macomb","Oakland","Washtenaw","Wayne"] },
  { code: "NY", name: "New York", status: "live", ...g(3, 8), countyLabel: "counties",
    counties: ["Albany","Allegany","Broome","Cattaraugus","Cayuga","Chautauqua","Chemung","Chenango","Clinton","Columbia","Cortland","Delaware","Dutchess","Erie","Essex","Franklin","Fulton","Genesee","Greene","Hamilton","Herkimer","Jefferson","Lewis","Livingston","Madison","Monroe","Montgomery","Nassau","Niagara","Oneida","Onondaga","Ontario","Orange","Orleans","Oswego","Otsego","Putnam","Rensselaer","Rockland","Saint Lawrence","Saratoga","Schenectady","Schoharie","Schuyler","Seneca","Steuben","Suffolk","Sullivan","Tioga","Tompkins","Ulster","Warren","Washington","Wayne","Westchester","Wyoming","Yates"],
    card: { badge: "LIVE", summary: "All 57 non-NYC counties · live assessment data · TP-584, IT-2663, RP-5217, Peconic Bay CPF, Suffolk R&E" },
    openDataUrl: "https://data.ny.gov/", openDataLabel: "data.ny.gov · 7vem-aaz7",
    subtitle: "New York · Suffolk + Westchester + statewide · live-data",
    preparedByRequired: true,
    recordingQuirk: "TP-584 + RP-5217 filed with the county Clerk; mansion tax applies at $1M+ on residential."
  },
  { code: "NYC", name: "New York City", status: "live", ...g(2, 8), countyLabel: "boroughs",
    counties: ["Bronx","Brooklyn","Manhattan","Queens","Staten Island"],
    card: { badge: "LIVE · ACRIS", summary: "5 boroughs · live PLUTO data (BBL + owner) · NYC RPTT + mansion schedule · TP-584 + RP-5217NYC filed, NYC-RPT via ACRIS" },
    openDataUrl: "https://data.cityofnewyork.us/", openDataLabel: "data.cityofnewyork.us · PLUTO",
    subtitle: "New York City · ACRIS module · 5 boroughs",
    preparedByRequired: true,
    recordingQuirk: "NYC-RPT filed via ACRIS with TP-584 + RP-5217NYC; mansion tax tiers 1.0–3.9% on residential ≥ $1M."
  },
  { code: "MA", name: "Massachusetts", status: "live", ...g(3, 9), countyLabel: "registries",
    counties: ["Barnstable","Berkshire Middle","Berkshire North","Berkshire South","Bristol Fall River","Bristol North","Bristol South","Dukes","Essex North","Essex South","Franklin","Hampden","Hampshire","Middlesex North","Middlesex South","Nantucket","Norfolk","Plymouth","Suffolk","Worcester North","Worcester"],
    card: { badge: "LIVE", summary: "14 registries · deeds excise engine (0.456%; Barnstable 0.648%) · MassGIS parcels · CPA surcharge notes" },
    openDataUrl: "https://www.mass.gov/orgs/massgis-bureau-of-geographic-information", openDataLabel: "MassGIS · L3 Parcels",
    subtitle: "Massachusetts · 14 registries of deeds · excise 0.456%",
    recordingQuirk: "Deeds excise paid to the Registry of Deeds; Barnstable County uses a higher rate."
  },
  { code: "OR", name: "Oregon", status: "beta", ...g(4, 1), countyLabel: "counties", counties: ["Clackamas","Deschutes","Jackson","Lane","Marion","Multnomah","Washington"] },
  { code: "NV", name: "Nevada", status: "beta", ...g(4, 2), countyLabel: "counties", counties: ["Clark","Washoe"] },
  { code: "WY", name: "Wyoming", status: "beta", ...g(4, 3), countyLabel: "counties", counties: ["Laramie","Natrona"] },
  { code: "SD", name: "South Dakota", status: "beta", ...g(4, 4), countyLabel: "counties", counties: ["Minnehaha","Pennington"] },
  { code: "IA", name: "Iowa", status: "beta", ...g(4, 5), countyLabel: "counties", counties: ["Linn","Polk","Scott"] },
  { code: "IL", name: "Illinois", status: "beta", ...g(4, 6), countyLabel: "counties", counties: ["Cook","DuPage","Kane","Lake","Will"] },
  { code: "IN", name: "Indiana", status: "beta", ...g(4, 7), countyLabel: "counties", counties: ["Allen","Hamilton","Lake","Marion"] },
  { code: "OH", name: "Ohio", status: "beta", ...g(4, 8), countyLabel: "counties", counties: ["Cuyahoga","Franklin","Hamilton","Montgomery","Summit"] },
  { code: "PA", name: "Pennsylvania", status: "live", ...g(4, 9), countyLabel: "counties",
    counties: ["Adams","Allegheny","Armstrong","Beaver","Bedford","Berks","Blair","Bradford","Bucks","Butler","Cambria","Cameron","Carbon","Centre","Chester","Clarion","Clearfield","Clinton","Columbia","Crawford","Cumberland","Dauphin","Delaware","Elk","Erie","Fayette","Forest","Franklin","Fulton","Greene","Huntingdon","Indiana","Jefferson","Juniata","Lackawanna","Lancaster","Lawrence","Lebanon","Lehigh","Luzerne","Lycoming","McKean","Mercer","Mifflin","Monroe","Montgomery","Montour","Northampton","Northumberland","Perry","Philadelphia","Pike","Potter","Schuylkill","Snyder","Somerset","Sullivan","Susquehanna","Tioga","Union","Venango","Warren","Washington","Wayne","Westmoreland","Wyoming","York"],
    card: { badge: "LIVE", summary: "All 67 counties · Philadelphia + Allegheny live data · statewide 1% state RTT + local (Philly 3.278%) · REV-183, REV-715" },
    openDataUrl: "https://www.pasda.psu.edu/", openDataLabel: "PASDA",
    subtitle: "Pennsylvania · 67 counties · 1% state RTT + local",
    recordingQuirk: "REV-183 Statement of Value required when consideration is not stated or is a gift/family transfer."
  },
  { code: "NJ", name: "New Jersey", status: "live", ...g(4, 10), countyLabel: "counties",
    counties: ["Atlantic","Bergen","Burlington","Camden","Cape May","Cumberland","Essex","Gloucester","Hudson","Hunterdon","Mercer","Middlesex","Monmouth","Morris","Ocean","Passaic","Salem","Somerset","Sussex","Union","Warren"],
    card: { badge: "LIVE", summary: "21 counties · MOD-IV live parcel data · Realty Transfer Fee + 2025 graduated fee · RTF-1/1EE, GIT/REP affidavits" },
    openDataUrl: "https://njgin.nj.gov/", openDataLabel: "NJGIN · MOD-IV",
    subtitle: "New Jersey · 21 counties · MOD-IV live parcel data",
    recordingQuirk: "RTF paid at recording; GIT/REP-3 (nonresident) or REP-1 required with the deed."
  },
  { code: "CT", name: "Connecticut", status: "live", ...g(4, 11), countyLabel: "towns",
    counties: ["Ansonia","Bridgeport","Danbury","Fairfield","Greenwich","Hartford","New Britain","New Haven","New London","Norwalk","Stamford","Waterbury","West Hartford","(169 towns total)"],
    card: { badge: "LIVE", summary: "169 towns · statewide parcel + CAMA live data (owner + appraised value) · conveyance-tax tiers · filed OP-236" },
    openDataUrl: "https://portal.ct.gov/OPM/IGPP/Publications/Real-Estate-Conveyance-Tax",
    subtitle: "Connecticut · 169 towns · conveyance-tax tiers",
    recordingQuirk: "OP-236 filed with the town clerk; residential portion above $2.5M taxed at 2.25%."
  },
  { code: "RI", name: "Rhode Island", status: "beta", ...g(4, 12), countyLabel: "counties", counties: ["Bristol","Kent","Newport","Providence","Washington"] },
  { code: "CA", name: "California", status: "beta", ...g(5, 1), countyLabel: "counties", counties: ["Alameda","Los Angeles","Orange","Sacramento","San Diego","San Francisco","Santa Clara"] },
  { code: "UT", name: "Utah", status: "beta", ...g(5, 2), countyLabel: "counties", counties: ["Davis","Salt Lake","Utah","Weber"] },
  { code: "CO", name: "Colorado", status: "beta", ...g(5, 3), countyLabel: "counties", counties: ["Adams","Arapahoe","Boulder","Denver","El Paso","Jefferson"] },
  { code: "NE", name: "Nebraska", status: "beta", ...g(5, 4), countyLabel: "counties", counties: ["Douglas","Lancaster","Sarpy"] },
  { code: "MO", name: "Missouri", status: "beta", ...g(5, 5), countyLabel: "counties", counties: ["Boone","Greene","Jackson","Saint Louis"] },
  { code: "KY", name: "Kentucky", status: "beta", ...g(5, 6), countyLabel: "counties", counties: ["Fayette","Jefferson","Kenton"] },
  { code: "WV", name: "West Virginia", status: "beta", ...g(5, 7), countyLabel: "counties", counties: ["Berkeley","Kanawha","Monongalia"] },
  { code: "VA", name: "Virginia", status: "beta", ...g(5, 8), countyLabel: "counties", counties: ["Arlington","Chesterfield","Fairfax","Henrico","Loudoun","Prince William","Virginia Beach"] },
  { code: "MD", name: "Maryland", status: "live", ...g(5, 9), countyLabel: "jurisdictions",
    counties: ["Allegany","Anne Arundel","Baltimore City","Baltimore County","Calvert","Caroline","Carroll","Cecil","Charles","Dorchester","Frederick","Garrett","Harford","Howard","Kent","Montgomery","Prince George's","Queen Anne's","Saint Mary's","Somerset","Talbot","Washington","Wicomico","Worcester"],
    card: { badge: "LIVE", summary: "24 jurisdictions · state transfer + county transfer + recordation stack · SDAT parcel data · first-time-buyer split" },
    openDataUrl: "https://sdat.dat.maryland.gov/RealProperty/", openDataLabel: "SDAT · Real Property",
    subtitle: "Maryland · 24 jurisdictions · state 0.5% + county + recordation",
    recordingQuirk: "First-time Maryland homebuyer: state transfer tax reduced to 0.25% and paid by the seller."
  },
  { code: "DE", name: "Delaware", status: "beta", ...g(5, 10), countyLabel: "counties", counties: ["Kent","New Castle","Sussex"] },
  { code: "AZ", name: "Arizona", status: "beta", ...g(6, 2), countyLabel: "counties", counties: ["Coconino","Maricopa","Pima","Pinal","Yavapai"] },
  { code: "NM", name: "New Mexico", status: "beta", ...g(6, 3), countyLabel: "counties", counties: ["Bernalillo","Doña Ana","Santa Fe"] },
  { code: "KS", name: "Kansas", status: "beta", ...g(6, 4), countyLabel: "counties", counties: ["Johnson","Sedgwick","Shawnee","Wyandotte"] },
  { code: "AR", name: "Arkansas", status: "beta", ...g(6, 5), countyLabel: "counties", counties: ["Benton","Pulaski","Washington"] },
  { code: "TN", name: "Tennessee", status: "beta", ...g(6, 6), countyLabel: "counties", counties: ["Davidson","Hamilton","Knox","Shelby"] },
  { code: "NC", name: "North Carolina", status: "live", ...g(6, 7), countyLabel: "counties",
    counties: ["Alamance","Alexander","Alleghany","Anson","Ashe","Avery","Beaufort","Bertie","Bladen","Brunswick","Buncombe","Burke","Cabarrus","Caldwell","Camden","Carteret","Caswell","Catawba","Chatham","Cherokee","Chowan","Clay","Cleveland","Columbus","Craven","Cumberland","Currituck","Dare","Davidson","Davie","Duplin","Durham","Edgecombe","Forsyth","Franklin","Gaston","Gates","Graham","Granville","Greene","Guilford","Halifax","Harnett","Haywood","Henderson","Hertford","Hoke","Hyde","Iredell","Jackson","Johnston","Jones","Lee","Lenoir","Lincoln","Macon","Madison","Martin","McDowell","Mecklenburg","Mitchell","Montgomery","Moore","Nash","New Hanover","Northampton","Onslow","Orange","Pamlico","Pasquotank","Pender","Perquimans","Person","Pitt","Polk","Randolph","Richmond","Robeson","Rockingham","Rowan","Rutherford","Sampson","Scotland","Stanly","Stokes","Surry","Swain","Transylvania","Tyrrell","Union","Vance","Wake","Warren","Washington","Watauga","Wayne","Wilkes","Wilson","Yadkin","Yancey"],
    card: { badge: "LIVE", summary: "100 counties · excise $1 per $500 · 7 Land Transfer Tax counties (up to 1%) · statewide parcel service" },
    openDataUrl: "https://www.nconemap.gov/", openDataLabel: "NC OneMap",
    subtitle: "North Carolina · 100 counties · excise $1/$500",
    recordingQuirk: "Land Transfer Tax counties (Camden, Chowan, Currituck, Dare, Pasquotank, Perquimans, Washington) add up to 1%."
  },
  { code: "SC", name: "South Carolina", status: "beta", ...g(6, 8), countyLabel: "counties", counties: ["Charleston","Greenville","Horry","Richland","Spartanburg"] },
  { code: "DC", name: "District of Columbia", status: "beta", ...g(6, 9), countyLabel: "wards", counties: ["Ward 1","Ward 2","Ward 3","Ward 4","Ward 5","Ward 6","Ward 7","Ward 8"] },
  { code: "OK", name: "Oklahoma", status: "beta", ...g(7, 4), countyLabel: "counties", counties: ["Cleveland","Oklahoma","Tulsa"] },
  { code: "LA", name: "Louisiana", status: "beta", ...g(7, 5), countyLabel: "parishes", counties: ["East Baton Rouge","Jefferson","Orleans","Saint Tammany"] },
  { code: "MS", name: "Mississippi", status: "beta", ...g(7, 6), countyLabel: "counties", counties: ["DeSoto","Hinds","Madison"] },
  { code: "AL", name: "Alabama", status: "beta", ...g(7, 7), countyLabel: "counties", counties: ["Jefferson","Madison","Mobile","Montgomery","Shelby"] },
  { code: "GA", name: "Georgia", status: "beta", ...g(7, 8), countyLabel: "counties", counties: ["Chatham","Cobb","DeKalb","Fulton","Gwinnett"] },
  { code: "HI", name: "Hawaii", status: "beta", ...g(8, 1), countyLabel: "counties", counties: ["Hawaii","Honolulu","Kauai","Maui"] },
  { code: "TX", name: "Texas", status: "beta", ...g(8, 4), countyLabel: "counties", counties: ["Bexar","Collin","Dallas","Denton","Fort Bend","Harris","Tarrant","Travis"] },
  { code: "FL", name: "Florida", status: "live", ...g(8, 9), countyLabel: "counties",
    counties: ["Alachua","Baker","Bay","Bradford","Brevard","Broward","Calhoun","Charlotte","Citrus","Clay","Collier","Columbia","DeSoto","Dixie","Duval","Escambia","Flagler","Franklin","Gadsden","Gilchrist","Glades","Gulf","Hamilton","Hardee","Hendry","Hernando","Highlands","Hillsborough","Holmes","Indian River","Jackson","Jefferson","Lafayette","Lake","Lee","Leon","Levy","Liberty","Madison","Manatee","Marion","Martin","Miami-Dade","Monroe","Nassau","Okaloosa","Okeechobee","Orange","Osceola","Palm Beach","Pasco","Pinellas","Polk","Putnam","Saint Johns","Saint Lucie","Santa Rosa","Sarasota","Seminole","Sumter","Suwannee","Taylor","Union","Volusia","Wakulla","Walton","Washington"],
    card: { badge: "LIVE", summary: "All 67 counties · statewide DOR cadastral (owner + just value) · doc-stamp engine 0.70%; Miami-Dade 0.60% + surtax" },
    openDataUrl: "https://floridarevenue.com/property/", openDataLabel: "FL DOR · Property",
    subtitle: "Florida · 67 counties · doc stamps 0.70%",
    recordingQuirk: "Florida has no state transfer form — documentary stamps are paid to the Clerk at recording. Miami-Dade adds a $0.45/$100 surtax on non-single-family."
  },
];

export function findState(code: string): StateInfo | undefined {
  return STATES.find((s) => s.code.toLowerCase() === code.toLowerCase());
}

/** Default county on intake — mirrors deed-copilot-prototype per-state defaults. */
export function defaultCounty(stateCode: string, counties: readonly string[]): string {
  if (stateCode === "NJ" && counties.includes("Bergen")) return "Bergen";
  return counties[0] ?? "";
}

export const LIVE_STATE_CODES = STATES.filter((s) => s.status === "live").map((s) => s.code);