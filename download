import { supabaseAdmin, type Platoon, type Squad, type Webhook } from "@/lib/supabase";
import { RollCallForm } from "@/components/RollCallForm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sb = supabaseAdmin();
  const [pRes, sRes, wRes] = await Promise.all([
    sb.from("platoons").select("*").order("name"),
    sb.from("squads").select("*").order("sort_order"),
    sb.from("webhooks").select("id,platoon_id,label,created_at").order("label"),
  ]);

  const platoons = (pRes.data as Platoon[]) ?? [];
  const squads = (sRes.data as Squad[]) ?? [];
  // Intentionally omit the `url` field from what we ship to the client.
  const webhooks = (wRes.data as Omit<Webhook, "url">[]) ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">New roll call</h1>
      </div>

      {platoons.length === 0 ? (
        <div className="panel p-6 bg-panel border border-border rounded-lg">
          <p className="text-muted">
            No platoons configured yet. Ask an admin to set one up at{" "}
            <a href="/admin" className="text-accent hover:underline">/admin</a>.
          </p>
        </div>
      ) : (
        <RollCallForm platoons={platoons} squads={squads} webhooks={webhooks} />
      )}
    </div>
  );
}
