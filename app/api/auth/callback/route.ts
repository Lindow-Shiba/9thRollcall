import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, fetchUser, fetchMemberRoles, hasPosterRole } from "@/lib/discord";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const session = await getSession();
  const expectedState = (session as any).oauthState;
  (session as any).oauthState = undefined;

  if (!code || !state || state !== expectedState) {
    await session.save();
    return NextResponse.redirect(`${siteUrl}/?auth=state-mismatch`);
  }

  try {
    const token = await exchangeCode(code, `${siteUrl}/api/auth/callback`);
    const [user, roles] = await Promise.all([
      fetchUser(token.access_token),
      fetchMemberRoles(token.access_token, process.env.DISCORD_GUILD_ID ?? ""),
    ]);

    session.user = {
      id: user.id,
      username: user.global_name ?? user.username,
      avatar: user.avatar,
      canPost: hasPosterRole(roles),
    };
    await session.save();

    return NextResponse.redirect(`${siteUrl}/`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(`${siteUrl}/?auth=failed`);
  }
}
