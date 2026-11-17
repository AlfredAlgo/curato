/**
 * ISRC (International Standard Recording Code) helpers.
 *
 * An ISRC is 12 characters: CC-XXX-YY-NNNNN
 *   CC    – 2-letter country code (e.g. ZA, US, GB)
 *   XXX   – 3-character alphanumeric registrant code
 *   YY    – 2-digit year of reference
 *   NNNNN – 5-digit designation code
 *
 * We store the compact form (no hyphens, uppercase), e.g. "ZAABC2400001",
 * and display the hyphenated form, e.g. "ZA-ABC-24-00001".
 */

const ISRC_PATTERN = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/;

/** Strip "ISRC" prefix, hyphens, spaces, and uppercase the input. */
export const normalizeIsrc = (input: string): string =>
  input
    .toUpperCase()
    .replace(/^ISRC[:\s]*/, "")
    .replace(/[^A-Z0-9]/g, "");

export const isValidIsrc = (input: string): boolean =>
  ISRC_PATTERN.test(normalizeIsrc(input));

/**
 * Validate an optional ISRC field.
 * Empty input is valid and yields `null` (ISRC is optional).
 */
export const parseIsrc = (
  input: string | null | undefined
): { valid: boolean; value: string | null; error: string | null } => {
  const raw = (input ?? "").trim();
  if (!raw) return { valid: true, value: null, error: null };

  const value = normalizeIsrc(raw);
  if (value.length !== 12) {
    return { valid: false, value: null, error: "ISRC must be 12 characters (e.g. ZA-ABC-24-00001)" };
  }
  if (!ISRC_PATTERN.test(value)) {
    return {
      valid: false,
      value: null,
      error: "Invalid ISRC format. Expected CC-XXX-YY-NNNNN (country, registrant, year, number)",
    };
  }
  return { valid: true, value, error: null };
};

/** "ZAABC2400001" -> "ZA-ABC-24-00001". Returns the input unchanged if it isn't a valid ISRC. */
export const formatIsrc = (isrc: string): string => {
  const v = normalizeIsrc(isrc);
  if (!ISRC_PATTERN.test(v)) return isrc;
  return `${v.slice(0, 2)}-${v.slice(2, 5)}-${v.slice(5, 7)}-${v.slice(7)}`;
};
