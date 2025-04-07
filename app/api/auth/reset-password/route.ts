import { NextRequest } from "next/server";
import { logtoConfig } from "../../../logto";

// Force this route to be dynamically rendered at runtime
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Redirect to Logto's password reset page
  const resetPasswordUrl = `${logtoConfig.endpoint.replace(
    /\/$/,
    "",
  )}/reset-password`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: resetPasswordUrl,
    },
  });
}
