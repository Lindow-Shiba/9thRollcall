import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  session.destroy();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "/";
  return NextResponse.redirect(siteUrl);
}
