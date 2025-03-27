import { NextRequest, NextResponse } from "next/server";
import { withApiProtection } from "../../protect-api";

// Force this route to be dynamically rendered at runtime
export const dynamic = "force-dynamic";

/**
 * A simple test endpoint that requires authentication
 * This can be used to verify that authentication is working
 */
export async function GET(request: NextRequest) {
  return withApiProtection(request, async (user) => {
    // Log the access
    console.log(
      `[Test API] Protected endpoint accessed by user: ${user.userId}`,
    );

    // Return a simple response
    return NextResponse.json({
      message: "This is a protected API endpoint",
      authenticated: true,
      userId: user.userId,
      timestamp: new Date().toISOString(),
    });
  });
}
