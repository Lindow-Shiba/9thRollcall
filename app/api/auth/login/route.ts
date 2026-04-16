import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { authorizeUrl } from "@/lib/discord";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const redirect = `${siteUrl}/api/auth/callback`;

  // CSRF state, stashed in the session cookie
  const state = randomBytes(16).toString("hex");
  const session = await getSession();
  (session as any).oauthState = state;
  await session.save();

  return NextResponse.redirect(authorizeUrl(redirect, state));
}
