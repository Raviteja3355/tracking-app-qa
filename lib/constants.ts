export const Tracking = {
  MAX_NUMBERS: 25,
  URP_REGEX: /^UR\d{17}$/,
  STATE_STEP_MAP: {
    190: 0,
    // Delivered
    203: 3,
    228: 3,
    // Out for Delivery
    191: 2,
    192: 2,
    198: 2,
    202: 2,
  } as Record<number, number>,
} as const;

export const Links = {
  home: "https://www.uniuni.com",
  support: "https://www.uniuni.com/support/",
  terms: "https://www.uniuni.com/terms-and-conditions/",
  privacy: "https://www.uniuni.com/privacy-policy/",
  cookies: "https://www.uniuni.com/cookies-policy/",
  invalidSearchImg: "https://cdn.uniuni.com/wp-content/uploads/2023/07/invalid-search.png",
} as const;

export const Support = {
  allowedFileTypes: ["application/pdf", "image/jpeg", "image/png"],
  maxFileSizeMb: 2,
} as const;

export const DateTime = {
  WEEKDAYS: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  MONTHS: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
} as const;
