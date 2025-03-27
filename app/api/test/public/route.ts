import { NextRequest, NextResponse } from "next/server";

// Force this route to be dynamically rendered at runtime
export const dynamic = "force-dynamic";

/**
 * A simple public endpoint that doesn't require authentication
 * This can be used to compare with the protected endpoint
 */
export async function GET(request: NextRequest) {
  // Log the access
  console.log(
    `[Test API] Public endpoint accessed: ${request.nextUrl.pathname}`,
  );

  // Return a simple response
  return NextResponse.json({
    message: "This is a public API endpoint",
    authenticated: false,
    timestamp: new Date().toISOString(),
  });
}
