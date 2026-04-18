import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, type Squad } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DISCORD_API = "https://discord.com/api/v10";

async function botRequest(path: string, method: string, body?: unknown) {
  const token = process.env.DISCORD_BOT_TOKEN!;
  const res = await fetch(`${DISCORD_API}${path}`, {
    method,
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Discord API error ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

function emojiToButton(emoji: string) {
  // Custom server emoji format: <:name:id>
  const match = emoji.match(/^<:([^:]+):(\d+)>$/);
  if (match) return { id: match[2], name: match[1] };
  return undefined; // standard unicode emoji — passed as label text
}

function buildRollCallMessage(opts: {
  title: string;
  description?: string | null;
  opTimeUnix: number;
  rollCallId: string;
  squads: Squad[];
  rsvps?: { display_name: string; squad_id: number | null; attendance: string }[];
  pingRoleIds?: string[];
  emojiYes: string;
  emojiMaybe: string;
  emojiNo: string;
}) {
  const { title, description, opTimeUnix, rollCallId, squads, rsvps = [], pingRoleIds, emojiYes, emojiMaybe, emojiNo } = opts;

  const squadFields = squads.map(s => {
    const members = rsvps
      .filter(r => r.squad_id === s.id)
      .map(r => {
        const emoji = r.attendance === "yes" ? emojiYes : r.attendance === "maybe" ? emojiMaybe : emojiNo;
        return `${emoji} ${r.display_name}`;
      });
    return {
      name: `${s.name} (${members.length})`,
      value: members.length > 0 ? members.join("\n") : "—",
      inline: true,
    };
  });

  const embed = {
    title,
    description: description ?? undefined,
    color: 0xC0392B,
    fields: [
      { name: "🗓️ Op Time (ET)", value: `<t:${opTimeUnix}:F> (<t:${opTimeUnix}:R>)`, inline: false },
      ...squadFields,
    ],
    footer: { text: `Roll Call ID: ${rollCallId}` },
  };

  const squadOptions = squads.map(s => ({
    label: s.name,
    description: s.kind.charAt(0).toUpperCase() + s.kind.slice(1),
    value: String(s.id),
  }));

  // Build buttons with emoji
  function makeButton(style: number, label: string, customId: string, emojiStr: string) {
    const btn: any = { type: 2, style, label, custom_id: customId };
    const custom = emojiToButton(emojiStr);
    if (custom) {
      btn.emoji = custom;
    }
    return btn;
  }

  const components = [
    {
      type: 1,
      components: [{
        type: 3,
        custom_id: `squad_select:${rollCallId}`,
        placeholder: "1. Select your squad / team / reserve",
        options: squadOptions.slice(0, 25),
        min_values: 1,
        max_values: 1,
      }],
    },
    {
      type: 1,
      components: [
        makeButton(3, `${emojiYes.startsWith("<:") ? "" : emojiYes + " "}Yes`, `attend:yes:${rollCallId}`, emojiYes),
        makeButton(2, `${emojiMaybe.startsWith("<:") ? "" : emojiMaybe + " "}Maybe`, `attend:maybe:${rollCallId}`, emojiMaybe),
        makeButton(4, `${emojiNo.startsWith("<:") ? "" : emojiNo + " "}No`, `attend:no:${rollCallId}`, emojiNo),
      ],
    },
  ];

  const pingContent = pingRoleIds && pingRoleIds.length > 0
    ? pingRoleIds.map(id => `<@&${id}>`).join(" ")
    : undefined;

  return { content: pingContent, embeds: [embed], components };
}

export async function POST(req: NextRequest) {
  let body: {
    platoonId?: number;
    title?: string;
    description?: string;
    opTimeUnix?: number;
    channelId?: string;
    pingRoleIds?: string[];
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { platoonId, title, description, opTimeUnix, channelId, pingRoleIds } = body;
  if (!platoonId || !title || !opTimeUnix || !channelId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const [pRes, sqRes, configRes] = await Promise.all([
    sb.from("platoons").select("*").eq("id", platoonId).single(),
    sb.from("squads").select("*").eq("platoon_id", platoonId).order("sort_order"),
    sb.from("discord_config").select("emoji_yes,emoji_maybe,emoji_no").eq("id", 1).single(),
  ]);

  if (pRes.error || !pRes.data) return NextResponse.json({ error: "Platoon not found" }, { status: 404 });
  const squads = (sqRes.data as Squad[]) ?? [];
  const emojiYes = configRes.data?.emoji_yes ?? "👍";
  const emojiMaybe = configRes.data?.emoji_maybe ?? "〰️";
  const emojiNo = configRes.data?.emoji_no ?? "👎";

  const { data: rollCallData, error: rcErr } = await sb
    .from("roll_calls")
    .insert({ platoon_id: platoonId, title, description: description?.trim() || null, op_time_unix: opTimeUnix })
    .select("id").single();

  if (rcErr || !rollCallData) return NextResponse.json({ error: "Failed to save roll call" }, { status: 500 });

  const message = buildRollCallMessage({
    title, description, opTimeUnix, rollCallId: rollCallData.id,
    squads, pingRoleIds: pingRoleIds ?? [],
    emojiYes, emojiMaybe, emojiNo,
  });

  try {
    const posted = await botRequest(`/channels/${channelId}/messages`, "POST", message);
    await sb.from("roll_calls").update({ discord_channel_id: channelId, discord_message_id: posted.id }).eq("id", rollCallData.id);
  } catch (err) {
    console.error("Failed to post to Discord:", err);
    return NextResponse.json({ error: "Failed to post to Discord" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
