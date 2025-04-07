import { NextRequest, NextResponse } from "next/server";
import { logToElastic } from "@/app/api/logging-middleware";
import {
  verifyAuthentication,
  type AuthResult,
} from "@/app/utils/auth-middleware";

// Define matcher for paths that should be protected
export const config = {
  matcher: [
    "/api/:path*", // Match all API routes
    "/((?!_next/static|_next/image|favicon.ico|callback|api/auth/*).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth/");

  // Skip authentication for auth routes to avoid circular dependencies
  if (isAuthRoute) {
    const response = NextResponse.next();

    // Log auth routes separately with more detailed information
    console.log(`[API] Auth route accessed: ${request.nextUrl.pathname}`);

    // Get basic auth info without full verification to avoid circular dependencies
    const authHeader = request.headers.get("authorization");
    const isLogged = !!authHeader && authHeader.startsWith("Bearer ");

    logToElastic(request, {
      status: response.status,
      statusText: response.statusText,
      responseTime: Date.now() - startTime,
      level: "info",
      route: "auth",
      isLogged: isLogged,
      method: request.method,
      path: request.nextUrl.pathname,
      authRoute: request.nextUrl.pathname,
    }).catch((error) => {
      console.error("Error logging to Elasticsearch:", error);
    });

    return response;
  }

  // For API routes, verify authentication
  if (isApiRoute) {
    // Get authentication information
    const auth = await verifyAuthentication(request);
    const isLogged = auth.isAuthenticated && !!auth.userId;
    const userName = auth.userInfo?.name || "未知用户";

    // 处理token过期的情况
    if (auth.error === "Token expired") {
      console.log(`[API] Token expired for ${request.nextUrl.pathname}`);
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    // 处理未认证的情况
    if (!auth.isAuthenticated) {
      console.log(`[API] Unauthorized access to ${request.nextUrl.pathname}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process the request normally
    const response = NextResponse.next();

    // Add user information to logs for API requests
    console.log(
      `[API] ${request.method} ${request.nextUrl.pathname} - ` +
        `Auth: ${isLogged ? "Yes" : "No"}` +
        `${auth.userId ? ` - User: ${auth.userId}` : ""}` +
        `${userName ? ` - Name: ${userName}` : ""}`,
    );

    // Log to Elasticsearch
    logToElastic(request, {
      status: response.status,
      statusText: response.statusText,
      responseTime: Date.now() - startTime,
      level: "info",
      isAuthenticated: auth.isAuthenticated,
      isLogged: isLogged,
      userId: auth.userId || "anonymous",
      userName: userName,
      username: auth.userInfo?.username,
      method: request.method,
      path: request.nextUrl.pathname,
    }).catch((error) => {
      console.error("Error logging to Elasticsearch:", error);
    });

    return response;
  }

  // For non-API routes, proceed normally
  return NextResponse.next();
}
