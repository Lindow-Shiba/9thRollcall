import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD ?? "";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const session = await getSession();

  // Tiny constant-time-ish compare. Good enough for a single shared password.
  if (!expected || password.length !== expected.length) {
    return NextResponse.redirect(`${siteUrl}/admin?err=1`);
  }
  let ok = 1;
  for (let i = 0; i < password.length; i++) {
    if (password.charCodeAt(i) !== expected.charCodeAt(i)) ok = 0;
  }
  if (!ok) {
    return NextResponse.redirect(`${siteUrl}/admin?err=1`);
  }

  session.admin = true;
  await session.save();
  return NextResponse.redirect(`${siteUrl}/admin`);
}

export async function DELETE() {
  const session = await getSession();
  session.admin = false;
  await session.save();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return NextResponse.redirect(`${siteUrl}/admin`);
}
