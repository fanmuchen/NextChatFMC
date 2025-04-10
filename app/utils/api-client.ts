import { fetchWithAuthHandling } from "./fetch-wrapper";

/**
 * Enhanced API client that handles authentication
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Promise<Response>
 */
export async function apiRequest(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  try {
    // Make the request with auth handling
    const response = await fetchWithAuthHandling(url, options);

    // If we get a 401, let Logto handle the refresh
    if (response.status === 401) {
      console.log(`[API] Unauthorized error for ${url}`);
      // Let the client handle the refresh through Logto SDK
      return response;
    }

    return response;
  } catch (error) {
    console.error(`[API] Error making request to ${url}:`, error);
    throw error;
  }
}
