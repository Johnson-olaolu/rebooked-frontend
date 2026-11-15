import type { IAddress } from "./user";

/** Body of PATCH /user/{id}/profile. Only the fields sent are updated. */
export interface IUpdateProfilePayload {
  userName?: string;
  bio?: string;
  contactEmail?: string;
  contactPhone?: string;
  /** Id returned by POST /file. */
  profilePictureId?: string;
  address?: IAddress;
}
