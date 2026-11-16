import type { IDocument } from "./api";
import type { IFile } from "./file";

export type RegistrationType = "EMAIL" | "GOOGLE" | "FACEBOOK";
export type Role = "user" | "superAdmin";

export interface IAddress {
  /** ISO country code; only "NG" for now. */
  country?: string;
  /** Canonical Nigerian state name (see utils/nigeria.ts). */
  state?: string;
  city?: string;
  /** Private: only returned to the owner. */
  addressLine?: string;
  /** Private: Google's full address. */
  formattedAddress?: string;
  /** Private: Google place id. */
  placeId?: string;
  /** Private: stored for future "near me" queries. */
  latitude?: number;
  longitude?: number;
}

export interface IProfile extends IDocument {
  userName?: string;
  bio?: string;
  contactEmail?: string;
  contactPhone?: string;
  profilePicture?: IFile | null;
  profilePictureUrl?: string | null;
  address?: IAddress | null;
  /** Set by the backend once userName and address.city are filled in. */
  onboardingCompleted: boolean;
}

export interface IUser extends IDocument {
  email: string;
  fullName: string;
  registrationType: RegistrationType;
  role: Role | string;
  profile?: IProfile | null;
  emailVerified: boolean;
  deleted: boolean;
}

/** What anyone can see about a seller (`GET /user/{id}`, API_CHANGES #17e). */
export interface ISellerProfile {
  id: string;
  userName: string;
  profilePictureUrl?: string | null;
  city?: string | null;
  state?: string | null;
  bio?: string | null;
  joinedAt?: string | null;
  availableCount?: number | null;
  soldCount?: number | null;
  hasPhone?: boolean;
  /** Kept up to date by the backend as ratings come in (API_CHANGES #22c). `stars` only on the seller page. */
  rating?: ISellerRating | null;
}

export interface ISellerRating {
  average: number;
  count: number;
  /** How many ratings of each star value, "1".."5". */
  stars?: Partial<Record<"1" | "2" | "3" | "4" | "5", number>>;
}
