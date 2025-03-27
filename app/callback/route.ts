import { handleSignIn } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { logtoConfig } from "../logto";

// Force this route to be dynamically rendered at runtime
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  await handleSignIn(logtoConfig, searchParams);

  redirect("/");
}
