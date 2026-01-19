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
  return parseInputDate(input);
};

const toAppTzFromUtc = (input: string | Date) => {
  const date = parseInputDate(input);
  return toZonedTime(date, APP_TIMEZONE);
};

const toAppIsoStringFromUtc = (input: string | Date) => {
  const date = parseInputDate(input);
  return formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

const toUtcIsoString = (input: string | Date) => {
  const date = parseInputDate(input);
  return date.toISOString();
};

const toUtcStartOfDayFromAppTz = (input: string) => {
  return fromZonedTime(`${input}T00:00:00`, APP_TIMEZONE);
};

const toUtcEndOfDayFromAppTz = (input: string) => {
  return fromZonedTime(`${input}T23:59:59.999`, APP_TIMEZONE);
};

export {
  APP_TIMEZONE,
  toAppIsoStringFromUtc,
  toAppTzFromUtc,
  toUtcFromAppTz,
  toUtcIsoString,
  toUtcStartOfDayFromAppTz,
  toUtcEndOfDayFromAppTz
};
