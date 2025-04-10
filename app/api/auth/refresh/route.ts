import { NextRequest, NextResponse } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "../../../logto";

export async function POST(request: NextRequest) {
  try {
    // Attempt to refresh the token using Logto
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated || !claims) {
      return NextResponse.json(
        { error: "Failed to refresh token" },
        { status: 401 },
      );
    }

    // Token refreshed successfully
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 401 },
    );
  }
}
