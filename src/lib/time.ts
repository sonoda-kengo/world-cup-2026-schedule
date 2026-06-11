import type { Locale } from "@/lib/i18n";

export type TimezoneKey = "nl" | "jp";

export const timezoneNames: Record<TimezoneKey, string> = {
  nl: "Europe/Amsterdam",
  jp: "Asia/Tokyo",
};

export function formatMatchDate(
  iso: string,
  timezone: TimezoneKey,
  locale: Locale,
): { day: string; dayKey: string; time: string; compact: string } {
  const date = new Date(iso);
  const lang = locale === "ja" ? "ja-JP" : "en-GB";
  const timeZone = timezoneNames[timezone];

  const day = new Intl.DateTimeFormat(lang, {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);

  const time = new Intl.DateTimeFormat(lang, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  const compact = new Intl.DateTimeFormat(lang, {
    timeZone,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  const dayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const dayPart = (type: string) => dayParts.find((part) => part.type === type)?.value ?? "";
  const dayKey = `${dayPart("year")}-${dayPart("month")}-${dayPart("day")}`;

  return { day, dayKey, time, compact };
}
