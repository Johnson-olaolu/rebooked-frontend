import { cn } from "~/lib/utils";
import type { IUser } from "~/types/user";
import { displayName } from "~/utils/text";

/** The name to show for a user, capitalised for display ("kastroud" → "Kastroud"). */
export const getDisplayName = (user?: IUser) => displayName(user?.profile?.userName) || displayName(user?.fullName);

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

interface UserAvatarProps {
  user?: IUser;
  /** For people we only have a summary of (e.g. a book's seller); used when `user` isn't given. */
  name?: string | null;
  photoUrl?: string | null;
  className?: string;
}

/** Profile photo, or initials in the brand style when there isn't one. */
const UserAvatar = ({ user, name: nameProp, photoUrl, className }: UserAvatarProps) => {
  const name = user ? getDisplayName(user) : displayName(nameProp);
  const photo = user ? user.profile?.profilePictureUrl : photoUrl;

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
