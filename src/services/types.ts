interface IDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface IResponse<D = null> {
  data?: D;
  status: boolean;
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  password: string;
}

export interface ConfirmEmailPayload {
  email: string;
  token: string;
}

export interface Role extends IDocument {
  id: string;
  name: string;
  description: string;
}

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
    }
  ];
  profile?: IProfile;
  username: string;
  emailVerified: boolean;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
}

export interface ILoginResponse {
  token: string;
  expiresIn: number;
  user: IUser;
}

export interface IFile extends IDocument {
  // user: IUser;

  name: string;

  url: string;

  mimetype: string;

  size: string;

  cloudinaryId: string;
}

export interface IProfile extends IDocument {
  userName?: string;

  bio?: string;

  contactEmail?: string;

  contactPhone?: string;

  profilePicture?: IFile;

  profilePictureUrl?: string;

  address?: IAddress;
}

export interface IAddress extends IDocument {
  state?: string;
  country?: string;
  formattedAddress?: string;
  location?: number[];
}

export interface IUpdateProfilePayload {
  userName?: string;
  bio?: string;
  contactEmail?: string;
  contactPhone?: string;
  profilePictureId?: string;
  address: {
    state?: string;
    country?: string;
    formattedAddress?: string;
    location?: number[];
  };
}
