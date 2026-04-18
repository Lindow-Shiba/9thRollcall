"use client";

import { useEffect, useState } from "react";
import type { Platoon, Squad } from "@/lib/supabase";

type Props = {
  platoons: Platoon[];
  squads: Squad[];
};

const EDGE = "https://wvcuddamlhtigvyuqzay.supabase.co/functions/v1/discord-setup";

type Channel = { id: string; name: string };
type Role = { id: string; name: string };

/**
 * Convert a datetime-local value (entered as New York time) to a UNIX timestamp.
 * Properly handles EST (UTC-5) and EDT (UTC-4) transitions.
 */
function newYorkToUnix(local: string): number | null {
  if (!local) return null;

  // Parse input as UTC to use as a reference point
  const inputAsUTC = new Date(local + 'Z');
  if (isNaN(inputAsUTC.getTime())) return null;

  // Find New York's UTC offset at this moment using Intl
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });

  const parts: Record<string, string> = {};
  fmt.formatToParts(inputAsUTC).forEach(({ type, value }) => { parts[type] = value; });

  const hr = parts.hour === '24' ? '00' : parts.hour;
  const nyAsUTC = new Date(`${parts.year}-${parts.month}-${parts.day}T${hr}:${parts.minute}:${parts.second}Z`);
  const offsetMs = inputAsUTC.getTime() - nyAsUTC.getTime();

  return Math.floor((inputAsUTC.getTime() + offsetMs) / 1000);
}

function unixToNYPreview(unix: number): string {
  return new Date(unix * 1000).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

const card: React.CSSProperties = {
  background: "#0d1117",
  border: "1px solid #1e2938",
  borderRadius: "8px",
  padding: "20px",
};

const sectionLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: "var(--muted)",
  marginBottom: "12px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const divider: React.CSSProperties = { flex: 1, height: "1px", background: "#1e2938" };

export function RollCallForm({ platoons, squads }: Props) {
  const [platoonId, setPlatoonId] = useState<number>(platoons[0]?.id ?? 0);
  const [title, setTitle] = useState("Cinder Platoon Roll Call");
  const [description, setDescription] = useState("Please respond accordingly for the op.\n\nRemember to download the mods.");
  const [opTime, setOpTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [discordLoading, setDiscordLoading] = useState(true);

  const platoonSquads = squads.filter((s) => s.platoon_id === platoonId);
  const opUnix = newYorkToUnix(opTime);

  useEffect(() => {
    async function loadDiscord() {
      setDiscordLoading(true);
      try {
        const config = await fetch(`${EDGE}?action=config`).then(r => r.json());
        if (!config?.guild_id) return;
        const [chRes, rolesRes] = await Promise.all([
          fetch(`${EDGE}?action=channels&guildId=${config.guild_id}`),
          fetch(`${EDGE}?action=roles&guildId=${config.guild_id}`),
        ]);
        const chList: Channel[] = await chRes.json();
        const roleList: Role[] = await rolesRes.json();
        setChannels(chList);
        setRoles(roleList);
        if (config.channel_id) setSelectedChannel(config.channel_id);
        if (config.ping_role_id) setSelectedRole(config.ping_role_id.split(",")[0] ?? "");
      } catch (e) {
        console.error(e);
      } finally {
        setDiscordLoading(false);
      }
    }
    loadDiscord();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (!opUnix) { setResult({ ok: false, msg: "Pick an operation date/time (New York time)." }); return; }
    if (!selectedChannel) { setResult({ ok: false, msg: "Select a Discord channel." }); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/rollcall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platoonId, title, description, opTimeUnix: opUnix,
          channelId: selectedChannel,
          pingRoleIds: selectedRole ? [selectedRole] : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, msg: data.error ?? "Failed to post." });
      } else {
        setResult({ ok: true, msg: "Roll call posted to Discord!" });
      }
    } catch (err) {
      setResult({ ok: false, msg: String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 300px" }}>
      <form onSubmit={submit} className="space-y-4">

        <div style={card}>
          <div style={sectionLabel}><span>Operation Details</span><span style={divider} /></div>
          <div className="space-y-4">
            <div>
              <label>Platoon</label>
              <select value={platoonId} onChange={(e) => setPlatoonId(Number(e.target.value))}>
                {platoons.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label>Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
            </div>
            <div>
              <label>Description</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1500} />
            </div>
            <div>
              <label>Op Date & Time — New York (ET)</label>
              <input type="datetime-local" value={opTime} onChange={(e) => setOpTime(e.target.value)} required />
              {opUnix && (
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                  🕐 {unixToNYPreview(opUnix)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={sectionLabel}><span>Discord</span><span style={divider} /></div>
          <div className="space-y-4">
            <div>
              <label>Post to Channel</label>
              {discordLoading ? (
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>Loading…</div>
              ) : channels.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--accent)" }}>
                  No server configured. Set up Discord in <a href="/admin" style={{ textDecoration: "underline" }}>Admin</a>.
                </div>
              ) : (
                <select value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)} required>
                  <option value="">— Select channel —</option>
                  {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              )}
            </div>
            {roles.length > 0 && (
              <div>
                <label>Ping Role (optional)</label>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                  <option value="">— No ping —</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: submitting ? "var(--border)" : "var(--accent)",
              color: submitting ? "var(--muted)" : "white",
              border: "none",
              borderRadius: "6px",
              padding: "10px 24px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Posting…" : "Post Roll Call"}
          </button>
          {result && (
            <span style={{ fontSize: "13px", color: result.ok ? "#3fb950" : "var(--accent)" }}>
              {result.msg}
            </span>
          )}
        </div>
      </form>

      <div>
        <div style={{ ...card, position: "sticky", top: "20px" }}>
          <div style={sectionLabel}><span>Preview</span><span style={divider} /></div>
          <div style={{ fontSize: "13px" }}>
            <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>{title || "(title)"}</div>
            {description && <div style={{ color: "var(--muted)", fontSize: "12px", whiteSpace: "pre-wrap", marginBottom: "8px" }}>{description}</div>}
            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>
              🗓️ {opUnix ? unixToNYPreview(opUnix) : "(pick a date/time)"}
            </div>
            {platoonSquads.length > 0 && (
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "6px" }}>SQUADS</div>
                {platoonSquads.map(s => (
                  <div key={s.id} style={{ fontSize: "12px", padding: "2px 0" }}>
                    • {s.name} <span style={{ color: "var(--muted)" }}>({s.kind})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
