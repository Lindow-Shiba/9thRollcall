import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: {
    rollCallId?: string;
    displayName?: string;
    squadId?: number | null;
    attendance?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { rollCallId, displayName, squadId, attendance } = body;

  if (!rollCallId || !displayName || !attendance) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!["yes", "maybe", "no"].includes(attendance)) {
    return NextResponse.json({ error: "Invalid attendance value" }, { status: 400 });
  }
  if (typeof displayName !== "string" || displayName.trim().length === 0 || displayName.length > 100) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const sb = supabaseAdmin();

  // Check roll call exists
  const { data: rc, error: rcErr } = await sb
    .from("roll_calls")
    .select("id")
    .eq("id", rollCallId)
    .single();

  if (rcErr || !rc) {
    return NextResponse.json({ error: "Roll call not found" }, { status: 404 });
  }

  // Upsert RSVP (so people can change their response)
  const { error } = await sb.from("rsvps").upsert(
    {
      roll_call_id: rollCallId,
      display_name: displayName.trim(),
      squad_id: squadId ?? null,
      attendance,
    },
    { onConflict: "roll_call_id,display_name" }
  );

  if (error) {
    console.error("RSVP upsert error:", error);
    return NextResponse.json({ error: "Failed to save RSVP" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
