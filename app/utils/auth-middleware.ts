import { NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "../logto";

export type AuthResult = {
  isAuthenticated: boolean;
  userId?: string;
  userInfo?: {
    name?: string;
    email?: string;
    picture?: string;
    username?: string;
  };
  error?: string;
};

// Token will be refreshed if it expires within this time window (in seconds)
const TOKEN_REFRESH_WINDOW = 1800; // 30 minutes

/**
 * Log token status with detailed information
 */
function logTokenStatus(
  pathname: string,
  claims: any,
  exp: number | undefined,
  now: number,
  status: string,
) {
  const timeToExpire = exp ? exp - now : undefined;
  const userId = claims?.sub;
  const username = claims?.username || claims?.name || "未命名用户";

  console.log(
    `[Auth Status] Request to ${pathname}:
    Status: ${status}
    User ID: ${userId || "N/A"}
    Username: ${username}
    Token Expiration: ${exp ? new Date(exp * 1000).toISOString() : "N/A"}
    Time to Expire: ${timeToExpire ? timeToExpire + " seconds" : "N/A"}
    Current Time: ${new Date(now * 1000).toISOString()}`,
  );
}

/**
 * Verifies authentication for server-side API requests
 * Returns user information if authenticated
 */
export async function verifyAuthentication(
  request: NextRequest,
): Promise<AuthResult> {
  try {
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);
    const now = Math.floor(Date.now() / 1000);

    // If not authenticated, return early with anonymous info
    if (!isAuthenticated || !claims) {
      logTokenStatus(
        request.nextUrl.pathname,
        claims,
        undefined,
        now,
        "Unauthenticated",
      );
      return {
        isAuthenticated: false,
        userId: "anonymous",
        userInfo: {
          name: "游客",
          email: undefined,
          picture: undefined,
        },
      };
    }

    // Check token expiration
    const exp = claims.exp;

    if (!exp) {
      logTokenStatus(
        request.nextUrl.pathname,
        claims,
        undefined,
        now,
        "Invalid Token - No Expiration",
      );
      return {
        isAuthenticated: false,
        userId: "error",
        userInfo: {
          name: "验证错误",
          email: undefined,
          picture: undefined,
        },
        error: "Invalid token",
      };
    }

    // If token is expired
    if (exp < now) {
      logTokenStatus(
        request.nextUrl.pathname,
        claims,
        exp,
        now,
        "Token Expired",
      );
      return {
        isAuthenticated: false,
        userId: "expired",
        userInfo: {
          name: "会话已过期",
          email: undefined,
          picture: undefined,
        },
        error: "Token expired",
      };
    }

    // Log normal token status before checking for refresh
    logTokenStatus(request.nextUrl.pathname, claims, exp, now, "Valid Token");

    // If token is about to expire, trigger a refresh by making a new getLogtoContext call
    // The Logto SDK will handle the refresh automatically
    if (exp - now < TOKEN_REFRESH_WINDOW) {
      console.log(
        `[Auth] Starting token refresh process for request to ${request.nextUrl.pathname}`,
      );

      try {
        console.log("[Auth] Calling Logto SDK to refresh token...");
        const refreshResult = await getLogtoContext(logtoConfig);

        if (!refreshResult.isAuthenticated) {
          logTokenStatus(
            request.nextUrl.pathname,
            refreshResult.claims,
            refreshResult.claims?.exp,
            now,
            "Token Refresh Failed",
          );
          return {
            isAuthenticated: false,
            userId: "expired",
            userInfo: {
              name: "会话已过期",
              email: undefined,
              picture: undefined,
            },
            error: "Token refresh failed",
          };
        }

        // Log successful refresh status
        logTokenStatus(
          request.nextUrl.pathname,
          refreshResult.claims,
          refreshResult.claims?.exp,
          now,
          "Token Refreshed Successfully",
        );
      } catch (error) {
        console.error("[Auth] Error during token refresh:", error);
        logTokenStatus(
          request.nextUrl.pathname,
          claims,
          exp,
          now,
          "Token Refresh Error - Using Existing Token",
        );
      }
    }

    // Extract user information from claims
    const userId = claims.sub;
    const displayName = claims.username || claims.name || "未命名用户";

    const userInfo = {
      name: displayName,
      username: claims.username || undefined,
      email: claims.email || undefined,
      picture: claims.picture || undefined,
    };

    return {
      isAuthenticated: true,
      userId,
      userInfo,
    };
  } catch (error) {
    console.error("[Auth] Error verifying authentication:", error);
    return {
      isAuthenticated: false,
      userId: "error",
      userInfo: {
        name: "验证错误",
        email: undefined,
        picture: undefined,
      },
      error: "Failed to verify authentication",
    };
  }
}

/**
 * Handles 401 Unauthorized errors by redirecting to the login page
 * This function should be called when a 401 error is received from the server
 */
export function handleUnauthorizedError() {
  console.log("[Auth] Unauthorized error received, redirecting to login page");
  // Clear any authentication state from localStorage if needed
  if (typeof window !== "undefined") {
    // Redirect to the login page
    window.location.href = "/api/auth/signin";
  }
}
