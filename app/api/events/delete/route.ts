import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const id = String(form.get("id") ?? "");
  if (!id) return NextResponse.redirect(`${req.nextUrl.origin}/events`);

  const sb = supabaseAdmin();
  await sb.from("roll_calls").delete().eq("id", id);

  return NextResponse.redirect(`${req.nextUrl.origin}/events`);
}
