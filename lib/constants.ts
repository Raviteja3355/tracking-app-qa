export const Tracking = {
  MAX_NUMBERS: 25,
  URP_REGEX: /^UR\d{17}$/,
  // Milestone state code groups (PRD Section 9)
  M1_CODES: [190, 1870] as number[],
  M2_CODE: 199,
  M3_CODES: [1910, 4010, 195, 255, 218, 219, 200] as number[],
  M4_CODES: [202, 220, 231, 232, 212, 213] as number[],
  M5_DELIVERED: [203, 216, 228] as number[],
  M5_TRANSFERRED: [217] as number[],
  M5_EXCEPTION: [206, 207, 209, 215, 222, 229, 235] as number[],
  M5_RETURNED: [230] as number[],
};

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
