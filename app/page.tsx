import { supabaseAdmin, type Platoon, type Squad } from "@/lib/supabase";
import { RollCallForm } from "@/components/RollCallForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const sb = supabaseAdmin();
  const [pRes, sRes] = await Promise.all([
    sb.from("platoons").select("*").order("name"),
    sb.from("squads").select("*").order("sort_order"),
  ]);

  const platoons = (pRes.data as Platoon[]) ?? [];
  const squads = (sRes.data as Squad[]) ?? [];

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #1e2938" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "var(--accent)", marginBottom: "4px" }}>
          OPERATIONS
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>New Roll Call</h1>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
          Post an interactive roll call to Discord. Members select their squad and attendance directly in the channel.
        </p>
      </div>

      {platoons.length === 0 ? (
        <div style={{ background: "#0d1117", border: "1px solid #1e2938", borderRadius: "8px", padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>
            No platoons configured yet.{" "}
            <a href="/admin" style={{ color: "var(--accent)", textDecoration: "underline" }}>Set one up in Admin</a>.
          </div>
        </div>
      ) : (
        <RollCallForm platoons={platoons} squads={squads} />
      )}
    </div>
  );
}
