/**
 * Utility functions for safe Select component handling
 */

/**
 * Ensures Select value is never an empty string, which causes SelectItem errors
 * @param value - The value to sanitize
 * @returns The value if valid, undefined if empty/invalid
 */
export function sanitizeSelectValue(value: string | undefined | null): string | undefined {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  return value;
}

/**
 * Ensures Select defaultValue is never an empty string
 * @param value - The value to sanitize for defaultValue
 * @returns The value if valid, undefined if empty/invalid
 */
export function sanitizeSelectDefaultValue(value: string | undefined | null): string | undefined {
  return sanitizeSelectValue(value);
}

/**
 * Safe wrapper for form field values in Select components
 * @param fieldValue - The form field value
 * @returns Sanitized value safe for Select components
 */
export function safeFormSelectValue(fieldValue: any): string | undefined {
  return sanitizeSelectValue(fieldValue);
}