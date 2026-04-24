export const AUTH_COOKIE_NAME = "portal_auth";

export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "admin123";

export function isValidCredential(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}
