"use client";

import { useState } from "react";
import type { Squad } from "@/lib/supabase";

type Props = {
  rollCallId: string;
  squads: Squad[];
};

export default function RSVPForm({ rollCallId, squads }: Props) {
  const [name, setName] = useState("");
  const [squadId, setSquadId] = useState<string>("");
  const [attendance, setAttendance] = useState<"yes" | "maybe" | "no" | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!attendance) {
      setResult({ ok: false, msg: "Please select Yes, Maybe or No." });
      return;
    }
    if (!name.trim()) {
      setResult({ ok: false, msg: "Please enter your name." });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollCallId,
          displayName: name.trim(),
          squadId: squadId ? Number(squadId) : null,
          attendance,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, msg: data.error ?? "Failed to save." });
      } else {
        setResult({ ok: true, msg: "Response saved! Refresh to see updated attendance." });
      }
    } catch (err) {
      setResult({ ok: false, msg: String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label>Your name / callsign</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. CC-2206 Lindow"
          maxLength={100}
          required
        />
      </div>

      <div>
        <label>Squad <span className="text-muted">(optional)</span></label>
        <select value={squadId} onChange={(e) => setSquadId(e.target.value)}>
          <option value="">— Select your squad —</option>
          {squads.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.kind})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block">Attendance</label>
        <div className="flex gap-3">
          {(["yes", "maybe", "no"] as const).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setAttendance(val)}
              className={`flex-1 py-2.5 rounded-md font-medium text-sm transition-colors border ${
                attendance === val
                  ? val === "yes"
                    ? "bg-green-600 border-green-500 text-white"
                    : val === "maybe"
                    ? "bg-yellow-600 border-yellow-500 text-white"
                    : "bg-red-700 border-red-600 text-white"
                  : "bg-panel border-border text-muted hover:text-text"
              }`}
            >
              {val === "yes" ? "👍 Yes" : val === "maybe" ? "〰️ Maybe" : "👎 No"}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-accent hover:bg-accentHover disabled:bg-border disabled:text-muted disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-md transition-colors"
      >
        {submitting ? "Saving…" : "Submit"}
      </button>

      {result && (
        <p className={result.ok ? "text-green-400 text-sm" : "text-accent text-sm"}>
          {result.msg}
        </p>
      )}
    </form>
  );
}
