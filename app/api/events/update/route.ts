import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function newYorkToUnix(local: string): number | null {
  if (!local) return null;
  // Parse the datetime as if it were UTC, then adjust for NY offset
  const inputAsUTC = new Date(local + ':00Z');
  if (isNaN(inputAsUTC.getTime())) return null;

  // Get NY local time at this UTC moment to find the offset
  const nyStr = inputAsUTC.toLocaleString("sv", { timeZone: "America/New_York" });
  const nyAsUTC = new Date(nyStr.replace(" ", "T") + "Z");
  const offsetMs = inputAsUTC.getTime() - nyAsUTC.getTime();
  return Math.floor((inputAsUTC.getTime() + offsetMs) / 1000);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const id = String(form.get("id") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const opTime = String(form.get("opTime") ?? "");

  const origin = req.nextUrl.origin;
  if (!id || !title) return NextResponse.redirect(`${origin}/events/${id}`);

  const opTimeUnix = newYorkToUnix(opTime);
  if (!opTimeUnix) return NextResponse.redirect(`${origin}/events/${id}`);

  const sb = supabaseAdmin();
  await sb.from("roll_calls").update({
    title,
    description: description || null,
    op_time_unix: opTimeUnix,
  }).eq("id", id);

  return NextResponse.redirect(`${origin}/events`);
}
