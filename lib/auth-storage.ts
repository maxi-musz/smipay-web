/**
 * Token and user storage utilities
 * Uses localStorage for persistence with activity tracking
 */

export interface User {
  id: string;
  email: string;
  phone_number: string;
  smipay_tag: string;
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  account_status: string;
  role: string;
  has_completed_onboarding?: boolean;
  wallet?: {
    current_balance: number;
    isActive: boolean;
  };
}

/** New-auth API user shape (§3.3 / §3.5 FRONTEND_DEVICE_METADATA.md) */
export interface NewAuthUser {
  id: string;
  email: string;
  name?: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  is_email_verified: boolean;
  role?: string;
  gender?: string | null;
  date_of_birth?: string | null;
  profile_image?: string | null;
  kyc_verified?: boolean;
  isTransactionPinSetup?: boolean;
  has_completed_onboarding?: boolean;
  created_at?: string;
}

/** Map new-auth user to app User */
export function mapNewAuthUserToUser(api: NewAuthUser): User {
  const ext = api as unknown as Record<string, unknown>;
  return {
    id: api.id,
    email: api.email,
    phone_number: api.phone_number ?? "",
    smipay_tag: (typeof ext.smipay_tag === "string" ? ext.smipay_tag : ""),
    first_name: api.first_name,
    last_name: api.last_name,
    is_email_verified: api.is_email_verified,
    is_phone_verified: ext.is_phone_verified === true,
    account_status: (typeof ext.account_status === "string" ? ext.account_status : "active"),
    role: api.role ?? "user",
    has_completed_onboarding: api.has_completed_onboarding ?? true,
    wallet: ext.wallet as User["wallet"] | undefined,
  };
}

const TOKEN_KEY = "smipay-access-token";
const USER_KEY = "smipay-user";
const LAST_ACTIVITY_KEY = "smipay-last-activity";
const TOKEN_EXPIRY_KEY = "smipay-token-expiry";
const PAYMENT_IN_PROGRESS_KEY = "smipay-payment-in-progress";
const PAYMENT_REFERENCE_KEY = "smipay-payment-reference";
const AUTH_STORE_KEY = "smipay-auth";

/** Secure cookies only persist over HTTPS; dev localhost must omit Secure. */
function cookieSecureSuffix(): string {
  if (typeof window === "undefined") return "";
  return window.location.protocol === "https:" ? "; Secure" : "";
}

/** Delete a cookie whether it was set with or without the Secure flag. */
function deleteCookie(name: string): void {
  const base = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
  document.cookie = base;
  document.cookie = `${base}; Secure`;
}

function setCookie(name: string, value: string, expires: Date): void {
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Strict${cookieSecureSuffix()}`;
}

// Session timeout: 7 days (aligns with backend JWT lifetime)
export const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
// Warning before timeout: 1 hour before expiry
export const SESSION_WARNING_TIME = 5 * 60 * 1000; //this should be 5 minutes in milliseconds

/**
 * Save authentication token
 * Saves to both localStorage and cookies for middleware access
 */
export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    const now = Date.now();
    const expiryTime = now + SESSION_TIMEOUT;
    
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    const expiryDate = new Date(expiryTime);
    setCookie(TOKEN_KEY, token, expiryDate);
  }
}

/**
 * Get authentication token
 */
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/**
 * Remove authentication token
 * Removes from both localStorage and cookies
 */
export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(PAYMENT_IN_PROGRESS_KEY);

    deleteCookie(TOKEN_KEY);
    deleteCookie(PAYMENT_IN_PROGRESS_KEY);
  }
}

/**
 * Save user data
 */
export function saveUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

/**
 * Get user data
 */
export function getUser(): User | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Remove user data
 */
export function removeUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_KEY);
  }
}

/**
 * Clear all auth data
 */
export function clearAuth(): void {
  removeToken();
  removeUser();
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORE_KEY);
    localStorage.removeItem(PAYMENT_REFERENCE_KEY);
  }
}

/**
 * True when the client has a valid persisted session (localStorage + expiry).
 * Middleware only sees cookies — use this on the client before trusting auth.
 */
export function hasValidClientSession(): boolean {
  const token = getToken();
  const user = getUser();
  return !!(token && user && !isSessionExpired());
}

/**
 * Update last activity timestamp
 */
export function updateLastActivity(): void {
  if (typeof window !== "undefined") {
    const now = Date.now();
    const expiryTime = now + SESSION_TIMEOUT;
    
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // Update cookie expiry
    const token = getToken();
    if (token) {
      setCookie(TOKEN_KEY, token, new Date(expiryTime));
    }
  }
}

/**
 * Get last activity timestamp
 */
export function getLastActivity(): number | null {
  if (typeof window !== "undefined") {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    return lastActivity ? parseInt(lastActivity, 10) : null;
  }
  return null;
}

/**
 * Get token expiry time
 */
export function getTokenExpiry(): number | null {
  if (typeof window !== "undefined") {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  }
  return null;
}

/**
 * Check if session has expired
 */
export function isSessionExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  
  return Date.now() > expiry;
}

/**
 * Get time until session expires (in milliseconds)
 */
export function getTimeUntilExpiry(): number {
  const expiry = getTokenExpiry();
  if (!expiry) return 0;
  
  return Math.max(0, expiry - Date.now());
}

/**
 * Mark that a payment is in progress (extends session)
 */
export function setPaymentInProgress(): void {
  if (typeof window !== "undefined") {
    const now = Date.now();
    localStorage.setItem(PAYMENT_IN_PROGRESS_KEY, now.toString());
    
    setCookie(PAYMENT_IN_PROGRESS_KEY, "true", new Date(now + 15 * 60 * 1000));
    
    // Extend session by SESSION_TIMEOUT to give time for payment
    updateLastActivity();
  }
}

/**
 * Clear payment in progress flag
 */
export function clearPaymentInProgress(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PAYMENT_IN_PROGRESS_KEY);
    
    deleteCookie(PAYMENT_IN_PROGRESS_KEY);
  }
}

/**
 * Check if payment is in progress
 */
export function isPaymentInProgress(): boolean {
  if (typeof window !== "undefined") {
    const paymentTime = localStorage.getItem(PAYMENT_IN_PROGRESS_KEY);
    if (!paymentTime) return false;
    
    // Consider payment in progress if flag was set within last 15 minutes
    const elapsed = Date.now() - parseInt(paymentTime, 10);
    return elapsed < 15 * 60 * 1000; // 15 minutes
  }
  return false;
}

/**
 * Persist payment reference across page redirects (Paystack redirect flow).
 * Stored in localStorage so it survives the full-page redirect to Paystack
 * and the redirect back to the app.
 */
export function savePaymentReference(reference: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(PAYMENT_REFERENCE_KEY, reference);
  }
}

export function getPaymentReference(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(PAYMENT_REFERENCE_KEY);
  }
  return null;
}

export function clearPaymentReference(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PAYMENT_REFERENCE_KEY);
  }
}

/**
 * Check if user is authenticated and session is valid
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  
  // If payment is in progress, extend session automatically
  if (isPaymentInProgress()) {
    updateLastActivity();
    return true;
  }
  
  // Check if session has expired
  if (isSessionExpired()) {
    clearAuth();
    return false;
  }
  
  return true;
}

