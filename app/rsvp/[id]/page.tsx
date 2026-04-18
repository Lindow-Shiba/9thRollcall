import { notFound } from "next/navigation";
import { supabaseAdmin, type Squad, type RSVP } from "@/lib/supabase";
import RSVPForm from "@/components/RSVPForm";

export const dynamic = "force-dynamic";

export default async function RSVPPage({ params }: { params: { id: string } }) {
  const sb = supabaseAdmin();

  const { data: rollCall, error } = await sb
    .from("roll_calls")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !rollCall) notFound();

  const [sqRes, rsvpRes] = await Promise.all([
    sb.from("squads").select("*").eq("platoon_id", rollCall.platoon_id).order("sort_order"),
    sb.from("rsvps").select("*").eq("roll_call_id", params.id).order("created_at"),
  ]);

  const squads = (sqRes.data as Squad[]) ?? [];
  const rsvps = (rsvpRes.data as RSVP[]) ?? [];

  const opDate = new Date(rollCall.op_time_unix * 1000);

  const yes = rsvps.filter((r) => r.attendance === "yes");
  const maybe = rsvps.filter((r) => r.attendance === "maybe");
  const no = rsvps.filter((r) => r.attendance === "no");

  return (
    <div className="max-w-lg mx-auto">
      {/* Roll call header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">{rollCall.title}</h1>
        {rollCall.description && (
          <p className="text-muted mt-1 text-sm">{rollCall.description}</p>
        )}
        <p className="text-sm mt-2">
          🗓️ {opDate.toLocaleString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* RSVP form */}
      <div className="bg-panel border border-border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Your attendance</h2>
        <RSVPForm rollCallId={params.id} squads={squads} />
      </div>

      {/* Current responses */}
      {rsvps.length > 0 && (
        <div className="bg-panel border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Responses <span className="text-muted text-sm font-normal">({rsvps.length})</span>
          </h2>

          {yes.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-green-400 mb-2">👍 Yes ({yes.length})</div>
              <ul className="space-y-1">
                {yes.map((r) => (
                  <li key={r.id} className="text-sm flex gap-2">
                    <span>{r.display_name}</span>
                    {r.squad_id && (
                      <span className="text-muted">
                        — {squads.find((s) => s.id === r.squad_id)?.name ?? ""}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {maybe.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-yellow-400 mb-2">〰️ Maybe ({maybe.length})</div>
              <ul className="space-y-1">
                {maybe.map((r) => (
                  <li key={r.id} className="text-sm flex gap-2">
                    <span>{r.display_name}</span>
                    {r.squad_id && (
                      <span className="text-muted">
                        — {squads.find((s) => s.id === r.squad_id)?.name ?? ""}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {no.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-red-400 mb-2">👎 No ({no.length})</div>
              <ul className="space-y-1">
                {no.map((r) => (
                  <li key={r.id} className="text-sm">
                    {r.display_name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
