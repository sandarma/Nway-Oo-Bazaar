/**
 * Shared phone number validation.
 *
 * Accepts common NZ formats (mobile & landline) as well as international
 * numbers.  Spaces, dashes, and parentheses are allowed between digits.
 *
 * Examples that pass:
 *   021 123 4567, 0211234567, +64 21 123 4567, 03-555-0123
 *
 * Examples that fail:
 *   abcdef, 123, 00000000000000000000 (too many digits)
 */
export const PHONE_REGEX =
   /^(\+?\d{1,3})?[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d{0,1}$/;

/**
 * Returns true when `value` looks like a valid phone number.
 * Strips common formatting characters and checks digit count (7-15).
 */
export function isValidPhone(value: string): boolean {
   const digits = value.replace(/[\s\-().]/g, '');
   if (digits.length < 7 || digits.length > 15) return false;
   return /^\+?\d+$/.test(digits);
}
