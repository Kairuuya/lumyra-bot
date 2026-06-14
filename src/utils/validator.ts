/**
 * Validates whether the input is a valid URL (HTTP/HTTPS protocols only).
 *
 * @param str - The value to be validated.
 * @returns True if the value is a valid HTTP/HTTPS URL, otherwise false.
 */
export const isURL = (str: unknown): str is string => {
  if (typeof str !== 'string') return false;
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Checks if a value is empty (null, undefined, or an empty string, array, buffer, map, set, or object).
 * Fully type-safe implementation without using 'any'.
 *
 * @param value - The value to be checked.
 * @returns True if the value is empty, otherwise false.
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (Buffer.isBuffer(value)) return value.length === 0;
  if (value instanceof Map || value instanceof Set) return value.size === 0;

  // Safely check plain object keys without prototype pollution risks
  if (typeof value === 'object') {
    // Prevent checking special instances like RegExp or Date as "empty objects"
    if (value instanceof RegExp || value instanceof Date) return false;
    return Object.keys(value as Record<string, unknown>).length === 0;
  }
  return false;
};

/**
 * Checks if a value is a valid numeric representation (including negative numbers, floats, and shorthand notation like ".5").
 * Matches both number types and numeric strings (e.g., "-123.45", ".5", "-.5").
 *
 * @param value - The value to be checked.
 * @returns True if the value is a valid numeric representation, otherwise false.
 */
export const isNumeric = (value: unknown): boolean => {
  if (typeof value === 'number') {
    return !Number.isNaN(value) && Number.isFinite(value);
  }
  if (typeof value === 'string') {
    // Supports integers, decimals, negative signs, and leading-decimal shorts like ".5"
    return /^-?(?:\d+(\.\d+)?|\.\d+)$/.test(value);
  }
  return false;
};
