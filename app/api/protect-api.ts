import { NextRequest, NextResponse } from "next/server";
import { verifyAuthentication } from "@/app/utils/auth-middleware";

/**
 * Higher order function to protect API routes with authentication
 * Use this as a wrapper for your API route handlers
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   return withApiProtection(request, async (user) => {
 *     // Your API logic here
 *     return NextResponse.json({ success: true });
 *   });
 * }
 */
export async function withApiProtection<T>(
  request: NextRequest,
  handler: (
    user: { userId: string; userInfo?: any },
    request: NextRequest,
  ) => Promise<T>,
): Promise<T | NextResponse> {
  // Verify the user authentication
  const auth = await verifyAuthentication(request);

  // If not authenticated, return 401 Unauthorized
  if (!auth.isAuthenticated) {
    console.log(
      `[API Protection] Unauthorized access to ${
        request.nextUrl.pathname
      } - User: ${auth.userId || "anonymous"} (${
        auth.userInfo?.name || "未知"
      })`,
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Call the handler with the authenticated user info
    console.log(
      `[API Protection] Authorized access to ${
        request.nextUrl.pathname
      } - User: ${auth.userId || "unknown"} (${auth.userInfo?.name || "未知"})`,
    );

    return await handler(
      {
        userId: auth.userId || "unknown",
        userInfo: auth.userInfo,
      },
      request,
    );
  } catch (error) {
    console.error(
      `[API Protection] Error in protected API route: ${
        request.nextUrl.pathname
      } - User: ${auth.userId || "unknown"} (${auth.userInfo?.name || "未知"})`,
      error,
    );

    // Return appropriate error response
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
