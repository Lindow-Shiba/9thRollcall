import { supabaseAdmin } from "@/lib/supabase";
import { DeleteEventButton } from "@/components/DeleteEventButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatNY(unix: number): string {
  return new Date(unix * 1000).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short", month: "short", day: "numeric",
    year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZoneName: "short",
  });
}

const card: React.CSSProperties = {
  background: "#0d1117",
  border: "1px solid #1e2938",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "12px",
};

export default async function EventsPage() {
  const sb = supabaseAdmin();
  const { data: rollCalls } = await sb
    .from("roll_calls")
    .select("*, platoons(name)")
    .order("op_time_unix", { ascending: false });

  const { data: rsvpCounts } = await sb.from("rsvps").select("roll_call_id");

  const countMap: Record<string, number> = {};
  (rsvpCounts ?? []).forEach((r: any) => {
    countMap[r.roll_call_id] = (countMap[r.roll_call_id] ?? 0) + 1;
  });

  const events = rollCalls ?? [];
  const now = Math.floor(Date.now() / 1000);
  const upcoming = events.filter((e: any) => e.op_time_unix >= now);
  const past = events.filter((e: any) => e.op_time_unix < now);

  return (
    <div>
      <div style={{ marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #1e2938" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "var(--accent)", marginBottom: "4px" }}>
          OPERATIONS
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Current Events</h1>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
          All roll calls — upcoming and past.
        </p>
      </div>

      {events.length === 0 && (
        <div style={{ ...card, textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
          No roll calls posted yet.{" "}
          <a href="/" style={{ color: "var(--accent)", textDecoration: "underline" }}>Post one now</a>.
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--muted)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>UPCOMING</span>
            <span style={{ flex: 1, height: "1px", background: "#1e2938" }} />
          </div>
          {upcoming.map((e: any) => (
            <EventCard key={e.id} event={e} count={countMap[e.id] ?? 0} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--muted)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>PAST</span>
            <span style={{ flex: 1, height: "1px", background: "#1e2938" }} />
          </div>
          {past.map((e: any) => (
            <EventCard key={e.id} event={e} count={countMap[e.id] ?? 0} past />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, count, past }: { event: any; count: number; past?: boolean }) {
  return (
    <div style={{ ...card, opacity: past ? 0.7 : 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "15px", fontWeight: 600 }}>{event.title}</span>
            {past && (
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--muted)", background: "#1e2938", padding: "2px 8px", borderRadius: "4px" }}>
                PAST
              </span>
            )}
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "6px" }}>
            {event.platoons?.name ?? "Unknown Platoon"}
          </div>
          {event.description && (
            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px", whiteSpace: "pre-wrap" }}>
              {event.description}
            </div>
          )}
          <div style={{ fontSize: "12px", color: "var(--text)" }}>
            🗓️ {formatNY(event.op_time_unix)}
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
            {count} {count === 1 ? "response" : "responses"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <a
            href={`/events/${event.id}`}
            style={{
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em",
              color: "var(--text)", background: "#1e2938",
              border: "none", borderRadius: "4px", padding: "6px 12px",
              textDecoration: "none",
            }}
          >
            EDIT
          </a>
          <DeleteEventButton id={event.id} />
        </div>
      </div>
    </div>
  );
}
