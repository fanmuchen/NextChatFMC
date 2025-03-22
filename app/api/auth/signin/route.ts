import { signIn } from "@logto/next/server-actions";
import { NextRequest } from "next/server";
import { logtoConfig } from "../../../logto";

export async function GET(request: NextRequest) {
  await signIn(logtoConfig);
  return new Response(null, { status: 302 });
}
