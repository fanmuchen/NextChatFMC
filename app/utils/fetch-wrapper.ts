import { handleUnauthorizedError } from "./auth-middleware";

/**
 * Wrapper for fetch that handles 401 Unauthorized errors globally
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Promise<Response>
 */
export async function fetchWithAuthHandling(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // Handle 401 Unauthorized errors
    if (response.status === 401) {
      console.error(`[Auth] Unauthorized error for request to ${url}`);
      handleUnauthorizedError();
      // Return the response so the caller can handle it if needed
    }

    return response;
  } catch (error) {
    console.error(`[Auth] Error fetching ${url}:`, error);
    throw error;
  }
}
