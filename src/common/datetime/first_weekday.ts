import { getWeekStartByLocale } from "weekstart";
import type { FrontendLocaleData } from "../../data/translation";
import { FirstWeekday } from "../../data/translation";

export const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const firstWeekdayIndex = (locale: FrontendLocaleData): WeekdayIndex => {
  if (locale.first_weekday === FirstWeekday.language) {
    // @ts-ignore
    if ("weekInfo" in Intl.Locale.prototype) {
      // @ts-ignore
      return new Intl.Locale(locale.language).weekInfo.firstDay % 7;
    }
    return (getWeekStartByLocale(locale.language) % 7) as WeekdayIndex;
  }
  return weekdays.includes(locale.first_weekday)
    ? (weekdays.indexOf(locale.first_weekday) as WeekdayIndex)
    : 1;
};

export const firstWeekday = (locale: FrontendLocaleData) => {
  const index = firstWeekdayIndex(locale);
  return weekdays[index];
};
