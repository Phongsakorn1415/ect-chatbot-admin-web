export const LANGUAGES = [
  { label: "ไทย", value: "thai" },
  { label: "อังกฤษ", value: "eng" },
  { label: "จีน", value: "chi" },
  { label: "ญี่ปุ่น", value: "jpn" },
  { label: "เกาหลี", value: "kor" },
  { label: "สเปน", value: "spa" },
  { label: "เยอรมัน", value: "ger" },
  { label: "อิตาลี", value: "ita" },
  { label: "รัสเซีย", value: "rus" },
] as const;

export type LanguageValue = typeof LANGUAGES[number]["value"];
