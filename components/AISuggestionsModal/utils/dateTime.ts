/**
 * Converts an ISO UTC string to a localized date-time string using the user's timezone.
 * Falls back to the original string when parsing fails.
 */
export function formatLocalDateTime(
  isoString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions & { locale?: string }
): string {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return String(isoString);
  }

  const { locale, ...formatOptions } = options ?? {};
  const resolvedLocale = locale ?? undefined;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  return date.toLocaleString(resolvedLocale, {
    ...defaultOptions,
    ...formatOptions,
  });
}
