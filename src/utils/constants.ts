export enum RegistrationType {
  GOOGLE = "GOOGLE",
  FACEBOOK = "FACEBOOK",
  EMAIL = "EMAIL",
}

export enum BookStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SOLD = "SOLD",
}

export enum TimeQuery {
  LAST_WEEK = "LAST_WEEK",
  LAST_TWO_WEEKS = "LAST_TWO_WEEKS",
  LAST_MONTH = "LAST_MONTH",
  LAST_SIX_MONTHS = "LAST_SIX_MONTHS",
  LAST_YEAR = "LAST_YEAR",
}

export const timeQueryOptions = [
  { label: "Last week", value: TimeQuery.LAST_WEEK },
  { label: "Last two weeks", value: TimeQuery.LAST_TWO_WEEKS },
  { label: "Last month", value: TimeQuery.LAST_MONTH },
  { label: "Last six months", value: TimeQuery.LAST_SIX_MONTHS },
  { label: "Last year", value: TimeQuery.LAST_YEAR },
];

export const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  SOLD: "bg-blue-100 text-blue-800",
};
