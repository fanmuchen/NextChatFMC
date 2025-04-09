import { fetchWithAuthHandling } from "./fetch-wrapper";
import { refreshTokenIfNeeded } from "./token-refresh";

/**
 * Enhanced API client that handles token refresh and authentication
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Promise<Response>
 */
export async function apiRequest(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  try {
    // Try to refresh token if needed before making the request
    await refreshTokenIfNeeded();

    // Make the request with auth handling
    const response = await fetchWithAuthHandling(url, options);

    // If we get a 401, try to refresh the token and retry once
    if (response.status === 401) {
      console.log(
        `[API] Unauthorized error for ${url}, attempting refresh and retry`,
      );

      // Check if it's a token expiration error
      try {
        const errorData = await response.clone().json();
        const isTokenExpired = errorData.code === "TOKEN_EXPIRED";

        if (isTokenExpired) {
          console.log(
            `[API] Token expired for ${url}, attempting refresh and retry`,
          );

          // Try to refresh token
          const refreshed = await refreshTokenIfNeeded();

          if (refreshed) {
            // Retry the request with the refreshed token
            return await fetchWithAuthHandling(url, options);
          }
        }
      } catch (parseError) {
        // If we can't parse the error JSON, just try to refresh anyway
        console.log(
          `[API] Could not parse error response for ${url}, attempting refresh anyway`,
        );

        // Try to refresh token
        const refreshed = await refreshTokenIfNeeded();

        if (refreshed) {
          // Retry the request with the refreshed token
          return await fetchWithAuthHandling(url, options);
        }
      }
    }

    return response;
  } catch (error) {
    console.error(`[API] Error making request to ${url}:`, error);
    throw error;
  }
}
