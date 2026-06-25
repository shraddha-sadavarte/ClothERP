/**
 * Decodes a JWT token and returns the payload object.
 * @param {string} token - The JWT token string.
 * @returns {object|null} Decoded payload or null if invalid.
 */
export const decodeToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Base64Url decode → Base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Extracts the expiration timestamp from a JWT token.
 * @param {string} token - The JWT token.
 * @returns {number|null} Unix timestamp (seconds) or null if invalid.
 */
export const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  return decoded?.exp ?? null;
};

/**
 * Checks if a token is expired.
 * @param {string} token - The JWT token.
 * @param {number} bufferSeconds - Optional grace period in seconds (default 0).
 * @returns {boolean} True if expired, false if valid.
 */
export const isTokenExpired = (token, bufferSeconds = 0) => {
  const exp = getTokenExpiration(token);
  if (exp === null) return true;
  const now = Math.floor(Date.now() / 1000);
  return now + bufferSeconds >= exp;
};

/**
 * Returns the remaining time (in seconds) until the token expires.
 * @param {string} token - The JWT token.
 * @returns {number|null} Seconds remaining, or null if invalid.
 */
export const getRemainingTime = (token) => {
  const exp = getTokenExpiration(token);
  if (exp === null) return null;
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, exp - now);
};

/**
 * Validates if a token is structurally valid and not expired.
 * @param {string} token - The JWT token.
 * @param {number} bufferSeconds - Optional grace period in seconds (default 0).
 * @returns {boolean} True if valid, false otherwise.
 */
export const isValidToken = (token, bufferSeconds = 0) => {
  if (!token || typeof token !== 'string') return false;
  const decoded = decodeToken(token);
  if (!decoded) return false;
  return !isTokenExpired(token, bufferSeconds);
};

/**
 * Extracts the username (subject) from the token.
 * @param {string} token - The JWT token.
 * @returns {string|null} Username or null.
 */
export const getUsernameFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded?.sub ?? null;
};

/**
 * Extracts the role from the token (if present).
 * @param {string} token - The JWT token.
 * @returns {string|null} Role or null.
 */
export const getRoleFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded?.role ?? null;
};

/**
 * Extracts the branchId from the token (if present).
 * @param {string} token - The JWT token.
 * @returns {string|null} branchId or null.
 */
export const getBranchIdFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded?.branchId ?? null;
};