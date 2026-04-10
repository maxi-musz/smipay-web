/** Login / registration / reset: numeric PIN length */
export const AUTH_PASSWORD_DIGITS = 6;

/** Email verification & password-reset codes from the API */
export const AUTH_EMAIL_OTP_DIGITS = 6;

export function isAuthPasswordValid(password: string): boolean {
  return new RegExp(`^\\d{${AUTH_PASSWORD_DIGITS}}$`).test(password);
}
