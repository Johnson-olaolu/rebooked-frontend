export const NG_COUNTRY_CODE = "NG";
export const NG_COUNTRY_NAME = "Nigeria";

/** Canonical state names — must match the backend's list (Constants). */
export const NG_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "Federal Capital Territory",
] as const;

export type NgState = (typeof NG_STATES)[number];

const FCT_ALIASES = ["abuja", "fct", "federal capital territory", "abuja federal capital territory"];

/**
 * Maps a free-form state name (e.g. Google's "Lagos State", "Abuja") to the
 * canonical name, or undefined if it isn't a Nigerian state.
 */
export const normalizeNgState = (name?: string | null): NgState | undefined => {
  if (!name) return undefined;
  const cleaned = name
    .toLowerCase()
    .replace(/\bstate\b/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (FCT_ALIASES.includes(cleaned)) return "Federal Capital Territory";
  // Google sometimes returns "Nassarawa" or "Akwa-Ibom".
  const compact = cleaned.replace(/\s/g, "").replace("nassarawa", "nasarawa");
  return NG_STATES.find((state) => state.toLowerCase().replace(/\s/g, "") === compact);
};
