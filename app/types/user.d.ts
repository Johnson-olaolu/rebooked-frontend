import type { IDocument } from "./api";

export interface IUser extends IDocument {
  id: string;
  email: string;
  fullName: string;
  enabled: boolean;
  credentialsNonExpired: boolean;
  deleted: boolean;
  onboarded: boolean;
  role: Role;
  authorities: [
    {
      authority: string;
    },
  ];
  profile?: IProfile;
  username: string;
  emailVerified: boolean;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
}
