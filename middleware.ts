import { NextRequest, NextResponse } from "next/server";
import { logToElastic } from "./app/api/logging-middleware";

// Define matcher for paths that should be logged
export const config = {
  matcher: [
    "/api/:path*", // Match all API routes
  ],
};

export async function middleware(request: NextRequest) {
  // Get response from the next middleware or route handler
  const startTime = Date.now();

  // Process the request normally
  const response = NextResponse.next();

  // Log the request asynchronously (don't await)
  logToElastic(request, {
    status: response.status,
    statusText: response.statusText,
    responseTime: Date.now() - startTime,
    level: "info",
  }).catch((error) => {
    console.error("Error logging to Elasticsearch:", error);
  });

  return response;
}
