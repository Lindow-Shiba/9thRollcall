import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD ?? "";

  const session = await getSession();

  if (!expected || password.length !== expected.length) {
    return NextResponse.redirect(`${origin}/admin?err=1`);
  }
  let ok = 1;
  for (let i = 0; i < password.length; i++) {
    if (password.charCodeAt(i) !== expected.charCodeAt(i)) ok = 0;
  }
  if (!ok) {
    return NextResponse.redirect(`${origin}/admin?err=1`);
  }

  session.admin = true;
  await session.save();
  return NextResponse.redirect(`${origin}/admin`);
}
