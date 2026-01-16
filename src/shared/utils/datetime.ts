import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

const APP_TIMEZONE = "America/Sao_Paulo";

const parseInputDate = (input: string | Date) => {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date input");
  }
  return date;
};

const toUtcFromAppTz = (input: string | Date) => {
  return fromZonedTime(input, APP_TIMEZONE);
};

const toAppTzFromUtc = (input: string | Date) => {
  const date = parseInputDate(input);
  return toZonedTime(date, APP_TIMEZONE);
};

const toAppIsoStringFromUtc = (input: string | Date) => {
  const date = parseInputDate(input);
  return formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

export { APP_TIMEZONE, toAppIsoStringFromUtc, toAppTzFromUtc, toUtcFromAppTz };
