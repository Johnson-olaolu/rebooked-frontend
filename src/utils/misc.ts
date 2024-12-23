export const isValidToken = (token?: string): boolean => {
  if (!token) {
    return false;
  }
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < currentTime) {
      return false;
    }
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false;
  }
};

export const getInitials = (name: string = "") => {
  let initials = "";
  const nameSplit = name.split(" ");

  if (nameSplit[0]) {
    initials += nameSplit[0].charAt(0).toUpperCase();
  }

  if (nameSplit[1]) {
    initials += nameSplit[1].charAt(0).toUpperCase();
  }

  return initials;
};
