import { NextRequest, NextResponse } from "next/server";
import { withApiProtection } from "../../protect-api";

// Force this route to be dynamically rendered at runtime
export const dynamic = "force-dynamic";

/**
 * Protected API route that returns the user's profile information
 * This is an example of using the withApiProtection middleware
 */
export async function GET(request: NextRequest) {
  return withApiProtection(request, async (user) => {
    console.log(`[User API] Getting profile for user: ${user.userId}`);

    // Return the user information
    return NextResponse.json({
      userId: user.userId,
      name: user.userInfo?.name || "Anonymous User",
      email: user.userInfo?.email,
      picture: user.userInfo?.picture,
    });
  });
}

/**
 * Example of a protected API route that updates user profile
 */
export async function POST(request: NextRequest) {
  return withApiProtection(request, async (user, req) => {
    console.log(`[User API] Updating profile for user: ${user.userId}`);

    try {
      // Parse the request body
      const body = await req.json();

      // Here you would typically update the user's profile in your database
      console.log(`[User API] Profile update data:`, body);

      // Return success response
      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
        updatedFields: Object.keys(body),
      });
    } catch (error) {
      console.error(`[User API] Error updating profile:`, error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
  });
}
