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

/**
 * Verifies authentication for server-side API requests
 * Returns user information if authenticated
 */
export async function verifyAuthentication(
  request: NextRequest,
): Promise<AuthResult> {
  try {
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    // If not authenticated, return early with anonymous info
    if (!isAuthenticated || !claims) {
      console.log(
        "[Auth] Unauthenticated request to",
        request.nextUrl.pathname,
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

    // 验证token是否过期
    const exp = claims.exp;
    if (!exp || exp * 1000 < Date.now()) {
      console.log(
        "[Auth] Token expired for request to",
        request.nextUrl.pathname,
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

    // Extract user information from claims
    const userId = claims.sub;

    // Handle potentially null values from claims
    const displayName = claims.username || claims.name || "未命名用户";

    const userInfo = {
      name: displayName,
      username: claims.username || undefined,
      email: claims.email || undefined,
      picture: claims.picture || undefined,
    };

    console.log(
      `[Auth] Authenticated request from user ${userId} (${displayName}) to ${request.nextUrl.pathname}`,
    );

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
