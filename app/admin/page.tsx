import { getSession } from "@/lib/session";
import { supabaseAdmin, type Platoon, type Squad } from "@/lib/supabase";
import DiscordSetup from "@/components/DiscordSetup";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const card: React.CSSProperties = {
  background: "#0d1117",
  border: "1px solid #1e2938",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "16px",
};

const sectionLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#6e7f96",
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { err?: string };
}) {
  const session = await getSession();

  if (!session.admin) {
    return (
      <div style={{ maxWidth: "400px", margin: "60px auto" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "var(--accent)", marginBottom: "8px" }}>
            RESTRICTED ACCESS
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Admin Panel</h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "6px" }}>
            Enter your admin password to continue.
          </p>
        </div>
        <form
          method="POST"
          action="/api/admin/login"
          style={{ background: "#0d1117", border: "1px solid #1e2938", borderRadius: "8px", padding: "24px" }}
        >
          <div style={{ marginBottom: "16px" }}>
            <label>Password</label>
            <input type="password" name="password" autoFocus required />
          </div>
          {searchParams.err && (
            <p style={{ fontSize: "12px", color: "var(--accent)", marginBottom: "12px" }}>Incorrect password.</p>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "10px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
        </form>
      </div>
    );
  }

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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #1e2938" }}>
        <div>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "var(--accent)", marginBottom: "4px" }}>
            CONFIGURATION
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Admin Panel</h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
            Manage platoons, squads, and Discord settings.
          </p>
        </div>
        <form method="POST" action="/api/admin/logout">
          <button type="submit" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", color: "var(--muted)", background: "none", border: "1px solid #1e2938", borderRadius: "4px", padding: "6px 12px", cursor: "pointer" }}>
            LOCK
          </button>
        </form>
      </div>

      {searchParams.err && (
        <div style={{ background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.3)", borderRadius: "6px", padding: "10px 14px", fontSize: "12px", color: "var(--accent)", marginBottom: "16px" }}>
          Error: {searchParams.err}
        </div>
      )}

      {/* Discord Setup */}
      <div style={card}>
        <div style={sectionLabel}>
          <span>Discord Configuration</span>
          <span style={{ flex: 1, height: "1px", background: "#1e2938" }} />
        </div>
        <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "16px", marginTop: "-8px" }}>
          Set the default server. Channel and ping roles are chosen per roll call on the Post page.
        </p>
        <DiscordSetup />
      </div>

      {/* New Platoon */}
      <div style={card}>
        <div style={sectionLabel}>
          <span>New Platoon</span>
          <span style={{ flex: 1, height: "1px", background: "#1e2938" }} />
        </div>
        <form method="POST" action="/api/admin/actions" style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <input type="hidden" name="action" value="platoon.create" />
          <div style={{ flex: 1 }}>
            <label>Platoon Name</label>
            <input type="text" name="name" placeholder="e.g. Cinder Platoon" required />
          </div>
          <button type="submit" style={{ background: "var(--accent)", color: "white", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", whiteSpace: "nowrap" }}>
            ADD
          </button>
        </form>
      </div>

      {/* Existing Platoons */}
      {platoons.map((p) => {
        const pSquads = squads.filter((s) => s.platoon_id === p.id);
        const byKind = {
          squad: pSquads.filter(s => s.kind === "squad"),
          team: pSquads.filter(s => s.kind === "team"),
          reserve: pSquads.filter(s => s.kind === "reserve"),
        };
        return (
          <div key={p.id} style={card}>
            {/* Platoon header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={sectionLabel as any}>
                <span>{p.name}</span>
                <span style={{ flex: 1, height: "1px", background: "#1e2938" }} />
              </div>
              <form method="POST" action="/api/admin/actions" style={{ marginLeft: "12px", marginBottom: "16px" }}>
                <input type="hidden" name="action" value="platoon.delete" />
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" style={{ fontSize: "11px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>
                  Delete
                </button>
              </form>
            </div>

            {/* Rename */}
            <form method="POST" action="/api/admin/actions" style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginBottom: "20px" }}>
              <input type="hidden" name="action" value="platoon.update" />
              <input type="hidden" name="id" value={p.id} />
              <div style={{ flex: 1 }}>
                <label>Platoon Name</label>
                <input type="text" name="name" defaultValue={p.name} required />
              </div>
              <button type="submit" style={{ background: "#1e2938", color: "var(--text)", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer" }}>
                SAVE
              </button>
            </form>

            {/* Squad list grouped by kind */}
            {(["squad", "team", "reserve"] as const).map(kind => {
              const list = byKind[kind];
              if (list.length === 0) return null;
              return (
                <div key={kind} style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                    {kind === "squad" ? "Squads" : kind === "team" ? "Teams" : "Reserves"}
                  </div>
                  {list.map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid #1e2938" }}>
                      <span style={{ width: "32px", fontSize: "11px", color: "var(--muted)", fontFamily: "monospace" }}>{s.sort_order}</span>
                      <span style={{ flex: 1, fontSize: "13px" }}>{s.name}</span>
                      <form method="POST" action="/api/admin/actions">
                        <input type="hidden" name="action" value="squad.delete" />
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" style={{ fontSize: "11px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>
                          Remove
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Add squad/team/reserve */}
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #1e2938" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--muted)", textTransform: "uppercase", marginBottom: "10px" }}>
                Add Unit
              </div>
              <form method="POST" action="/api/admin/actions" style={{ display: "grid", gridTemplateColumns: "1fr 130px 90px auto", gap: "10px", alignItems: "flex-end" }}>
                <input type="hidden" name="action" value="squad.create" />
                <input type="hidden" name="platoon_id" value={p.id} />
                <div>
                  <label>Name</label>
                  <input type="text" name="name" placeholder="Cinder 1-1" required />
                </div>
                <div>
                  <label>Kind</label>
                  <select name="kind" defaultValue="squad">
                    <option value="squad">Squad</option>
                    <option value="team">Team</option>
                    <option value="reserve">Reserve</option>
                  </select>
                </div>
                <div>
                  <label>Sort</label>
                  <input type="number" name="sort_order" defaultValue={(pSquads.length + 1) * 10} />
                </div>
                <button type="submit" style={{ background: "var(--accent)", color: "white", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer" }}>
                  SAVE
                </button>
              </form>
            </div>
          </div>
        );
      })}
    </div>
  );
}
