import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const session = await getSession();
  session.admin = false;
  await session.save();
  return NextResponse.redirect(`${origin}/admin`);
}
