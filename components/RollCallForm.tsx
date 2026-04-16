"use client";

import { useEffect, useMemo, useState } from "react";
import type { Platoon, Squad, Webhook } from "@/lib/supabase";

type Props = {
  platoons: Platoon[];
  squads: Squad[];
  webhooks: Omit<Webhook, "url">[];
};

/**
 * Local datetime -> UNIX seconds. Respects the user's browser timezone so
 * what they see in the picker is what Discord will render to every viewer.
 */
function localToUnix(local: string): number | null {
  if (!local) return null;
  const ms = new Date(local).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 1000);
}

export function RollCallForm({ platoons, squads, webhooks }: Props) {
  const [platoonId, setPlatoonId] = useState<number>(platoons[0]?.id ?? 0);
  const [title, setTitle] = useState("Cinder Platoon Roll Call");
  const [description, setDescription] = useState(
    "Please react accordingly for the op.\n\nRemember to download the mods — it's a joint operation."
  );
  const [opTime, setOpTime] = useState(""); // datetime-local
  const [pingRoleOverride, setPingRoleOverride] = useState(""); // optional override
  const [webhookId, setWebhookId] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const selectedPlatoon = platoons.find((p) => p.id === platoonId);
  const platoonSquads = useMemo(
    () => squads.filter((s) => s.platoon_id === platoonId),
    [squads, platoonId]
  );
  const platoonWebhooks = useMemo(
    () => webhooks.filter((w) => w.platoon_id === platoonId),
    [webhooks, platoonId]
  );

  // Default the webhook selection when platoon changes
  useEffect(() => {
    if (platoonWebhooks.length > 0 && !platoonWebhooks.some((w) => w.id === webhookId)) {
      setWebhookId(platoonWebhooks[0].id);
    }
  }, [platoonWebhooks, webhookId]);

  const opUnix = localToUnix(opTime);
  const previewLines = useMemo(() => {
    const lines: string[] = [];
    const ping = pingRoleOverride || selectedPlatoon?.ping_role_id;
    if (ping) lines.push(`@role(${ping})`);
    lines.push(`## ${title || "(title)"}`);
    if (description) lines.push(description);
    lines.push("");
    if (opUnix) {
      const d = new Date(opUnix * 1000);
      lines.push(`🗓️  ${d.toLocaleString()} (each viewer sees their local time)`);
    } else {
      lines.push(`🗓️  (pick a date/time)`);
    }
    lines.push("");
    lines.push("React: 👍 yes   👎 no   〰️ maybe");
    if (platoonSquads.length > 0) {
      lines.push("");
      lines.push("Squads");
      for (const s of platoonSquads) {
        lines.push(`• ${s.name} (${s.kind})`);
      }
    }
    return lines;
  }, [title, description, opUnix, pingRoleOverride, selectedPlatoon, platoonSquads]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (!opUnix) {
      setResult({ ok: false, msg: "Pick an operation date/time." });
      return;
    }
    if (!webhookId) {
      setResult({ ok: false, msg: "No webhook selected." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/rollcall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platoonId,
          title,
          description,
          opTimeUnix: opUnix,
          pingRoleOverride: pingRoleOverride || null,
          webhookId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, msg: data.error ?? "Failed to post." });
      } else {
        setResult({ ok: true, msg: "Posted." });
      }
    } catch (err) {
      setResult({ ok: false, msg: String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div>
          <label>Platoon</label>
          <select value={platoonId} onChange={(e) => setPlatoonId(Number(e.target.value))}>
            {platoons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1500}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Op date &amp; time (your local timezone)</label>
            <input
              type="datetime-local"
              value={opTime}
              onChange={(e) => setOpTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Post to</label>
            <select
              value={webhookId}
              onChange={(e) => setWebhookId(Number(e.target.value))}
              disabled={platoonWebhooks.length === 0}
            >
              {platoonWebhooks.length === 0 ? (
                <option value={0}>(no webhooks for this platoon)</option>
              ) : (
                platoonWebhooks.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div>
          <label>
            Ping role ID override <span className="text-muted">(optional)</span>
          </label>
          <input
            type="text"
            placeholder={selectedPlatoon?.ping_role_id ?? "platoon default"}
            value={pingRoleOverride}
            onChange={(e) => setPingRoleOverride(e.target.value)}
          />
          <p className="text-xs text-muted mt-1">
            Leave blank to use the platoon&rsquo;s default role.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || platoonWebhooks.length === 0}
            className="bg-accent hover:bg-accentHover disabled:bg-border disabled:text-muted disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-md transition-colors"
          >
            {submitting ? "Posting…" : "Post roll call"}
          </button>
          {result && (
            <span className={result.ok ? "text-green-400 text-sm" : "text-accent text-sm"}>
              {result.msg}
            </span>
          )}
        </div>
      </div>

      <aside className="bg-panel border border-border rounded-lg p-4 h-fit sticky top-6">
        <div className="text-xs text-muted uppercase tracking-wider mb-3">Preview</div>
        <pre className="text-sm whitespace-pre-wrap font-sans text-text/90 leading-relaxed">
{previewLines.join("\n")}
        </pre>
      </aside>
    </form>
  );
}
