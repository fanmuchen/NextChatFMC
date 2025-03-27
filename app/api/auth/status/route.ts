import { NextRequest, NextResponse } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "../../../logto";

// Force this route to be dynamically rendered at runtime
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    return NextResponse.json({
      isAuthenticated,
      claims,
    });
  } catch (error) {
    console.error("Error checking authentication status:", error);
    return NextResponse.json(
      {
        isAuthenticated: false,
        error: "Failed to check authentication status",
      },
      { status: 500 },
    );
  }
}
