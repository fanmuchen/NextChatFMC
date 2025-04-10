import { handleUnauthorizedError } from "./auth-middleware";
import { useAuthStore } from "../store/auth";

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
  const authStore = useAuthStore.getState();

  try {
    const response = await fetch(url, options);

    // Handle 401 Unauthorized errors
    if (response.status === 401) {
      console.error(`[Auth] Unauthorized error for request to ${url}`);

      // If we're already refreshing, wait for it to complete
      if (authStore.isRefreshing) {
        // Wait for a short time and retry the request
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchWithAuthHandling(url, options);
      }

      // Set refreshing state to prevent multiple refresh attempts
      authStore.setRefreshing(true);

      try {
        // Attempt to refresh the token
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (refreshResponse.ok) {
          // Token refreshed successfully, retry the original request
          authStore.setRefreshing(false);
          return fetchWithAuthHandling(url, options);
        } else {
          // Token refresh failed, redirect to login
          authStore.setAuthenticated(false);
          authStore.setRefreshing(false);
          handleUnauthorizedError();
        }
      } catch (error) {
        console.error("[Auth] Error refreshing token:", error);
        authStore.setRefreshing(false);
        handleUnauthorizedError();
      }
    }

    return response;
  } catch (error) {
    console.error(`[Auth] Error fetching ${url}:`, error);
    throw error;
  }
}
