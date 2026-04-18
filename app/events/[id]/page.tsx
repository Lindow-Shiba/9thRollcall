import { supabaseAdmin, type Squad } from "@/lib/supabase";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const card: React.CSSProperties = {
  background: "#0d1117",
  border: "1px solid #1e2938",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "16px",
};

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const sb = supabaseAdmin();
  const { data: event, error } = await sb
    .from("roll_calls")
    .select("*, platoons(name)")
    .eq("id", params.id)
    .single();

  if (error || !event) notFound();

  // Convert unix to NY local datetime-local string
  const nyDate = new Date(event.op_time_unix * 1000).toLocaleString("sv", {
    timeZone: "America/New_York",
  }).replace(" ", "T").substring(0, 16);

  const { data: rsvps } = await sb
    .from("rsvps")
    .select("*, squads(name)")
    .eq("roll_call_id", params.id)
    .order("created_at");

  const { data: squads } = await sb
    .from("squads")
    .select("*")
    .eq("platoon_id", event.platoon_id)
    .order("sort_order");

  const squadList = (squads ?? []) as Squad[];
  const rsvpList = rsvps ?? [];

  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #1e2938" }}>
        <a href="/events" style={{ fontSize: "11px", color: "var(--muted)", textDecoration: "none", letterSpacing: "0.08em" }}>
          ← BACK TO EVENTS
        </a>
        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "var(--accent)", marginBottom: "4px", marginTop: "12px" }}>
          EDIT EVENT
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>{event.title}</h1>
      </div>

      {/* Edit form */}
      <div style={card}>
        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--muted)", marginBottom: "16px" }}>
          DETAILS
        </div>
        <form method="POST" action="/api/events/update" className="space-y-4">
          <input type="hidden" name="id" value={event.id} />
          <div>
            <label>Title</label>
            <input type="text" name="title" defaultValue={event.title} required />
          </div>
          <div>
            <label>Description</label>
            <textarea rows={3} name="description" defaultValue={event.description ?? ""} maxLength={1500} />
          </div>
          <div>
            <label>Op Date & Time — New York (ET)</label>
            <input type="datetime-local" name="opTime" defaultValue={nyDate} required />
          </div>
          <button
            type="submit"
            style={{
              background: "var(--accent)", color: "white", border: "none",
              borderRadius: "6px", padding: "8px 20px", fontSize: "11px",
              fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer",
            }}
          >
            SAVE CHANGES
          </button>
        </form>
      </div>

      {/* Attendance */}
      {rsvpList.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--muted)", marginBottom: "16px" }}>
            ATTENDANCE ({rsvpList.length})
          </div>
          {squadList.map(s => {
            const members = rsvpList.filter((r: any) => r.squad_id === s.id);
            if (members.length === 0) return null;
            return (
              <div key={s.id} style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "4px" }}>
                  {s.name.toUpperCase()}
                </div>
                {members.map((r: any) => (
                  <div key={r.id} style={{ fontSize: "13px", padding: "4px 0", borderBottom: "1px solid #1e2938", display: "flex", justifyContent: "space-between" }}>
                    <span>{r.display_name}</span>
                    <span style={{ color: r.attendance === "yes" ? "#3fb950" : r.attendance === "maybe" ? "#d29922" : "var(--accent)" }}>
                      {r.attendance === "yes" ? "👍 Yes" : r.attendance === "maybe" ? "〰️ Maybe" : "👎 No"}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
