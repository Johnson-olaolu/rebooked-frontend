import { cn } from "~/lib/utils";
import type { IUser } from "~/types/user";

export const getDisplayName = (user?: IUser) => user?.profile?.userName?.trim() || user?.fullName?.trim() || "";

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

interface UserAvatarProps {
  user?: IUser;
  className?: string;
}

/** Profile photo, or initials in the brand style when there isn't one. */
const UserAvatar = ({ user, className }: UserAvatarProps) => {
  const name = getDisplayName(user);
  const photo = user?.profile?.profilePictureUrl;

  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-foreground/15 bg-secondary font-serif text-[13px] font-medium text-primary",
        className,
      )}
    >
      {photo ? <img src={photo} alt="" className="size-full object-cover" /> : getInitials(name) || "?"}
    </span>
  );
};

export default UserAvatar;
