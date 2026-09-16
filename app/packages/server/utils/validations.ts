/**
 * Shared phone number / email validation.
 *
 * Accepts common NZ phone formats (mobile & landline) as well as international
 * numbers, AND email addresses.
 *
 * Phone examples that pass:
 *   021 123 4567, 0211234567, +64 21 123 4567, 03-555-0123
 *
 * Email examples that pass:
 *   user@example.com, test.name@domain.co.nz
 */
export const PHONE_REGEX =
   /^(\+?\d{1,3})?[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d[\s\-()]*\d{0,1}$/;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Returns true when `value` looks like a valid phone number or email address.
 */
export function isValidPhone(value: string): boolean {
   // Accept email addresses
   if (EMAIL_REGEX.test(value)) return true;
   // Accept phone numbers (7-15 digits)
   const digits = value.replace(/[\s\-().]/g, '');
   if (digits.length < 7 || digits.length > 15) return false;
   return /^\+?\d+$/.test(digits);
}
