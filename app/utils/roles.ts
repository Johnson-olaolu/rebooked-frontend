import type { IUser } from "~/types/user";

export const ROLE_SUPER_ADMIN = "superAdmin";

/** Admin screens (and the API's `/admin/**`) are for the super admin only. */
export const isAdmin = (user?: Pick<IUser, "role"> | null) => user?.role === ROLE_SUPER_ADMIN;
