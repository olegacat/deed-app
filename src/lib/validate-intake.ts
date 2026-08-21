import type { DeedForm } from "@/lib/deed-form.types";
import type { IntakeProfile } from "@/lib/intake-profiles";
import { getJurisdictionConfig } from "@/lib/jurisdiction-config";

export type IntakeFieldKey =
  | "parcelUsed"
  | "county"
  | "house"
  | "street"
  | "city"
  | "owner"
  | "parcel"
  | "marketValue"
  | "granteeType"
  | "deedType"
  | "granteeName"
  | "trusteeAddress"
  | "consideration"
  | "date"
  | "preparedByName"
  | "buyerAttorney"
  | "buyerAttorneyPhone"
  | "sellerAttorney"
  | "sellerAttorneyPhone"
  | "exemptionDescribe"
  | "additionalGrantees";

export type IntakeFieldErrors = Partial<Record<IntakeFieldKey, string>>;

function missing(value: string | undefined | null): boolean {
  return !value?.trim();
}

function setError(errors: IntakeFieldErrors, key: IntakeFieldKey, message: string) {
  errors[key] = message;
}

export function validateIntakeForm(
  stateCode: string,
  form: DeedForm,
  intake: IntakeProfile,
  parcelUsed: boolean,
): IntakeFieldErrors {
  const errors: IntakeFieldErrors = {};
  const cfg = getJurisdictionConfig(stateCode);

  if (!parcelUsed) {
    setError(errors, "parcelUsed", intake.parcelBlockedHint);
  }

  if (missing(form.county)) {
    setError(errors, "county", `${intake.jurisdictionLabel} is required.`);
  }
  if (missing(form.house)) setError(errors, "house", "House # is required.");
  if (missing(form.street)) setError(errors, "street", "Street is required.");

  if (intake.showCity && missing(form.city)) {
    setError(errors, "city", "City / town is required.");
  }
  if (intake.showOwner && missing(form.owner)) {
    setError(errors, "owner", "Owner is required.");
  }
  if (intake.showParcelNumber && missing(form.parcel)) {
    setError(
      errors,
      "parcel",
      stateCode === "FL" ? "Parcel / folio # is required." : "Parcel # is required.",
    );
  }
  if (cfg.manualRequiresAssessedValue && missing(form.marketValue)) {
    setError(errors, "marketValue", "County assessed value is required.");
  }

  if (missing(form.granteeType)) {
    setError(errors, "granteeType", "Grantee (buyer) type is required.");
  }
  if (intake.showDeedType && missing(form.deedType)) {
    setError(errors, "deedType", "Deed type is required.");
  }
  if (missing(form.granteeName)) {
    setError(errors, "granteeName", "New grantee name is required.");
  }
  if (intake.showTrusteeAddress && form.granteeType === "Estate / Trust" && missing(form.trusteeAddress)) {
    setError(errors, "trusteeAddress", "Trustee address is required.");
  }

  if (!form.nominal) {
    if (missing(form.consideration)) {
      setError(errors, "consideration", "Sale price is required.");
    } else if (Number(form.consideration) <= 0) {
      setError(errors, "consideration", "Enter a sale price greater than zero.");
    }
  }

  if (missing(form.date)) {
    setError(errors, "date", `${intake.dateLabel} is required.`);
  }

  if (intake.showPreparedBy !== false && missing(form.preparedByName)) {
    setError(errors, "preparedByName", `${intake.preparedByLabel} is required.`);
  }

  if (intake.attorneyPhones) {
    if (missing(form.buyerAttorney)) {
      setError(errors, "buyerAttorney", "Buyer's attorney is required.");
    }
    if (missing(form.buyerAttorneyPhone)) {
      setError(errors, "buyerAttorneyPhone", "Buyer's attorney phone is required.");
    }
    if (missing(form.sellerAttorney)) {
      setError(errors, "sellerAttorney", "Seller's attorney is required.");
    }
    if (missing(form.sellerAttorneyPhone)) {
      setError(errors, "sellerAttorneyPhone", "Seller's attorney phone is required.");
    }
  } else {
    if (missing(form.buyerAttorney)) {
      setError(errors, "buyerAttorney", "Buyer's attorney is required.");
    }
    if (missing(form.sellerAttorney)) {
      setError(errors, "sellerAttorney", "Seller's attorney is required.");
    }
  }

  if (intake.njExemption && form.njExemption === "Other exempt conveyance (describe)" && missing(form.exemptionDescribe)) {
    setError(errors, "exemptionDescribe", "Describe the exempt conveyance.");
  }

  if (missing(form.additionalGrantees)) {
    setError(errors, "additionalGrantees", "Additional grantees is required (enter “None” if not applicable).");
  }

  return errors;
}

export function intakeErrorMessages(errors: IntakeFieldErrors): string[] {
  return Object.values(errors);
}

export function intakeIsValid(errors: IntakeFieldErrors): boolean {
  return Object.keys(errors).length === 0;
}
