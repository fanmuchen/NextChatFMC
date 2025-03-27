import { signIn } from "@logto/next/server-actions";
import { NextRequest } from "next/server";
import { logtoConfig } from "../../../logto";

// Force this route to be dynamically rendered at runtime
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await signIn(logtoConfig);
  return new Response(null, { status: 302 });
}
