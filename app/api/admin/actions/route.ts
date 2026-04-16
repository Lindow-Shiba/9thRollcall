import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Single endpoint for all admin mutations. Dispatches on the `action` form field.
 * Using plain form POSTs (no JSON) so the admin page can work without JS.
 *
 * Actions:
 *   platoon.create     name, ping_role_id
 *   platoon.update     id, name, ping_role_id
 *   platoon.delete     id
 *   squad.create       platoon_id, name, kind, sort_order
 *   squad.delete       id
 *   webhook.create     platoon_id, label, url
 *   webhook.delete     id
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.admin) {
    return NextResponse.json({ error: "Admin auth required" }, { status: 401 });
  }

  const form = await req.formData();
  const action = String(form.get("action") ?? "");
  const sb = supabaseAdmin();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const backTo = `${siteUrl}/admin`;

  const str = (k: string) => {
    const v = form.get(k);
    return v == null ? "" : String(v).trim();
  };
  const num = (k: string) => {
    const v = str(k);
    return v ? Number(v) : null;
  };

  try {
    switch (action) {
      case "platoon.create": {
        const name = str("name");
        if (!name) return NextResponse.redirect(`${backTo}?err=name-required`);
        await sb.from("platoons").insert({
          name,
          ping_role_id: str("ping_role_id") || null,
        });
        break;
      }
      case "platoon.update": {
        const id = num("id");
        if (!id) return NextResponse.redirect(`${backTo}?err=id-required`);
        await sb.from("platoons").update({
          name: str("name"),
          ping_role_id: str("ping_role_id") || null,
        }).eq("id", id);
        break;
      }
      case "platoon.delete": {
        const id = num("id");
        if (id) await sb.from("platoons").delete().eq("id", id);
        break;
      }
      case "squad.create": {
        const platoon_id = num("platoon_id");
        const name = str("name");
        const kind = str("kind");
        const sort_order = num("sort_order") ?? 0;
        if (!platoon_id || !name || !["squad", "section", "reserve"].includes(kind)) {
          return NextResponse.redirect(`${backTo}?err=invalid-squad`);
        }
        await sb.from("squads").insert({ platoon_id, name, kind, sort_order });
        break;
      }
      case "squad.delete": {
        const id = num("id");
        if (id) await sb.from("squads").delete().eq("id", id);
        break;
      }
      case "webhook.create": {
        const platoon_id = num("platoon_id");
        const label = str("label");
        const url = str("url");
        if (!platoon_id || !label || !url.startsWith("https://discord.com/api/webhooks/")) {
          return NextResponse.redirect(`${backTo}?err=invalid-webhook`);
        }
        await sb.from("webhooks").insert({ platoon_id, label, url });
        break;
      }
      case "webhook.delete": {
        const id = num("id");
        if (id) await sb.from("webhooks").delete().eq("id", id);
        break;
      }
      default:
        return NextResponse.redirect(`${backTo}?err=unknown-action`);
    }
  } catch (err) {
    console.error("admin action error:", err);
    return NextResponse.redirect(`${backTo}?err=db-error`);
  }

  return NextResponse.redirect(backTo);
}
