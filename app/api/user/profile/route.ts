import { NextRequest, NextResponse } from "next/server";
import { withApiProtection } from "../../protect-api";
import { getManagementApiToken } from "../../../utils/logto-management-api";
import { logtoConfig } from "../../../logto";

// Force this route to be dynamically rendered at runtime
export const dynamic = "force-dynamic";

/**
 * Protected API route that returns the user's profile information
 * This is an example of using the withApiProtection middleware
 */
export async function GET(request: NextRequest) {
  return withApiProtection(request, async (user) => {
    console.log(`[User API] Getting profile for user: ${user.userId}`);

    try {
      // Get detailed user information from Logto Management API
      const managementApiToken = await getManagementApiToken();
      const userEndpoint = `${logtoConfig.endpoint.replace(
        /\/$/,
        "",
      )}/api/users/${user.userId}`;

      const userResponse = await fetch(userEndpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${managementApiToken}`,
        },
      });

      if (!userResponse.ok) {
        console.error(
          `[User API] Failed to fetch user details:`,
          await userResponse.text(),
        );
        // Fall back to basic user info if detailed fetch fails
        return NextResponse.json({
          userId: user.userId,
          name: user.userInfo?.name || "Anonymous User",
          email: user.userInfo?.email,
          picture: user.userInfo?.picture,
        });
      }

      const userData = await userResponse.json();
      console.log(`[User API] Successfully fetched user details`);

      // Return the detailed user information
      return NextResponse.json({
        userId: user.userId,
        name: userData.name || user.userInfo?.name || "Anonymous User",
        email: userData.primaryEmail || user.userInfo?.email,
        picture: user.userInfo?.picture,
        username: userData.username,
        phone: userData.primaryPhone,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        lastSignInAt: userData.lastSignInAt,
        isSuspended: userData.isSuspended,
        hasPassword: userData.hasPassword,
        customData: userData.customData || {},
        profile: userData.profile || {},
        identities: userData.identities || {},
      });
    } catch (error) {
      console.error(`[User API] Error fetching user details:`, error);
      // Fall back to basic user info if there's an error
      return NextResponse.json({
        userId: user.userId,
        name: user.userInfo?.name || "Anonymous User",
        email: user.userInfo?.email,
        picture: user.userInfo?.picture,
      });
    }
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
