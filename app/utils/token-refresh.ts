// Token will be refreshed if it expires within this time window (in seconds)
const TOKEN_REFRESH_WINDOW = 1800; // 30 minutes

/**
 * Checks if the token is about to expire and refreshes it if needed
 * @returns Promise<boolean> - true if token was refreshed, false otherwise
 */
export async function refreshTokenIfNeeded(): Promise<boolean> {
  try {
    // Check auth status which will trigger token refresh on the server if needed
    const response = await fetch("/api/auth/status");

    if (!response.ok) {
      console.error("[Token Refresh] Failed to refresh token");
      return false;
    }

    const data = await response.json();

    if (!data.isAuthenticated || !data.claims) {
      console.error("[Token Refresh] Not authenticated or no claims");
      return false;
    }

    // Check if token is about to expire
    const exp = data.claims.exp;
    if (!exp) {
      console.error("[Token Refresh] No expiration time in claims");
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeToExpire = exp - now;

    // If token is about to expire, it will be refreshed by the server
    // We just need to check if the refresh was successful
    if (timeToExpire < TOKEN_REFRESH_WINDOW) {
      console.log(
        `[Token Refresh] Token refreshed, new expiration in ${
          exp - now
        } seconds`,
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error("[Token Refresh] Error refreshing token:", error);
    return false;
  }
}

/**
 * Wrapper for API calls that ensures token is refreshed if needed before making the request
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Promise<Response>
 */
export async function fetchWithTokenRefresh(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  // Try to refresh token if needed before making the request
  await refreshTokenIfNeeded();

  // Make the actual request
  return fetch(url, options);
}
