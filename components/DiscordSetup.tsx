"use client";

import { useEffect, useState } from "react";

const EDGE = "https://wvcuddamlhtigvyuqzay.supabase.co/functions/v1/discord-setup";

type Guild = { id: string; name: string };
type Channel = { id: string; name: string };
type Role = { id: string; name: string };
type Emoji = { id: string; name: string; formatted: string; url: string };

const DEFAULT_EMOJIS = [
  { label: "👍 Thumbs Up", value: "👍" },
  { label: "〰️ Wavy Dash", value: "〰️" },
  { label: "👎 Thumbs Down", value: "👎" },
  { label: "✅ Check Mark", value: "✅" },
  { label: "❌ Cross Mark", value: "❌" },
  { label: "⚡ Lightning", value: "⚡" },
];

export default function DiscordSetup() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [emojis, setEmojis] = useState<Emoji[]>([]);

  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const [emojiYes, setEmojiYes] = useState("👍");
  const [emojiMaybe, setEmojiMaybe] = useState("〰️");
  const [emojiNo, setEmojiNo] = useState("👎");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [configRes, guildsRes] = await Promise.all([
          fetch(`${EDGE}?action=config`),
          fetch(`${EDGE}?action=guilds`),
        ]);
        const config = await configRes.json();
        const guildList: Guild[] = await guildsRes.json();
        setGuilds(guildList);

        if (config?.guild_id) {
          const g = guildList.find(g => g.id === config.guild_id) ?? { id: config.guild_id, name: config.guild_name ?? config.guild_id };
          setSelectedGuild(g);

          const [chRes, rolesRes, emojiRes] = await Promise.all([
            fetch(`${EDGE}?action=channels&guildId=${config.guild_id}`),
            fetch(`${EDGE}?action=roles&guildId=${config.guild_id}`),
            fetch(`${EDGE}?action=emojis&guildId=${config.guild_id}`),
          ]);
          const chList: Channel[] = await chRes.json();
          const roleList: Role[] = await rolesRes.json();
          const emojiList: Emoji[] = await emojiRes.json();
          setChannels(chList);
          setRoles(roleList);
          setEmojis(emojiList);

          if (config.channel_id) {
            const ch = chList.find(c => c.id === config.channel_id) ?? { id: config.channel_id, name: config.channel_name ?? config.channel_id };
            setSelectedChannel(ch);
          }
          if (config.ping_role_id) setSelectedRole(config.ping_role_id.split(",")[0] ?? "");
          if (config.emoji_yes) setEmojiYes(config.emoji_yes);
          if (config.emoji_maybe) setEmojiMaybe(config.emoji_maybe);
          if (config.emoji_no) setEmojiNo(config.emoji_no);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function onGuildChange(guildId: string) {
    const guild = guilds.find(g => g.id === guildId) ?? null;
    setSelectedGuild(guild);
    setSelectedChannel(null);
    setSelectedRole("");
    setChannels([]);
    setRoles([]);
    setEmojis([]);
    if (!guildId) return;
    const [chRes, rolesRes, emojiRes] = await Promise.all([
      fetch(`${EDGE}?action=channels&guildId=${guildId}`),
      fetch(`${EDGE}?action=roles&guildId=${guildId}`),
      fetch(`${EDGE}?action=emojis&guildId=${guildId}`),
    ]);
    setChannels(await chRes.json());
    setRoles(await rolesRes.json());
    setEmojis(await emojiRes.json());
  }

  // Build emoji options: server emojis first, then defaults
  function emojiOptions() {
    const serverOptions = emojis.map(e => ({
      label: `:${e.name}:`,
      value: e.formatted,
      img: e.url,
    }));
    return serverOptions;
  }

  async function save() {
    if (!selectedGuild || !selectedChannel) {
      setResult({ ok: false, msg: "Please select a server and channel." });
      return;
    }
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch(`${EDGE}?action=save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guild_id: selectedGuild.id,
          guild_name: selectedGuild.name,
          channel_id: selectedChannel.id,
          channel_name: selectedChannel.name,
          ping_role_id: selectedRole || null,
          ping_role_name: roles.find(r => r.id === selectedRole)?.name ?? null,
          emoji_yes: emojiYes,
          emoji_maybe: emojiMaybe,
          emoji_no: emojiNo,
        }),
      });
      const data = await res.json();
      setResult(data.ok ? { ok: true, msg: "Discord settings saved!" } : { ok: false, msg: data.error ?? "Failed." });
    } catch (e) {
      setResult({ ok: false, msg: String(e) });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ fontSize: "12px", color: "var(--muted)" }}>Loading Discord settings…</p>;

  const serverEmojis = emojiOptions();
  const hasServerEmojis = serverEmojis.length > 0;

  return (
    <div className="space-y-5">
      {/* Server */}
      <div>
        <label>Discord Server</label>
        <select value={selectedGuild?.id ?? ""} onChange={e => onGuildChange(e.target.value)}>
          <option value="">— Select a server —</option>
          {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Channel */}
      {channels.length > 0 && (
        <div>
          <label>Default roll call channel</label>
          <select
            value={selectedChannel?.id ?? ""}
            onChange={e => {
              const ch = channels.find(c => c.id === e.target.value) ?? null;
              setSelectedChannel(ch);
            }}
          >
            <option value="">— Select a channel —</option>
            {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
          </select>
        </div>
      )}

      {/* Default ping role */}
      {roles.length > 0 && (
        <div>
          <label>Default ping role</label>
          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
            <option value="">— No ping —</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      )}

      {/* Attendance emojis */}
      <div>
        <label style={{ marginBottom: "8px", display: "block" }}>
          Attendance Emojis
          {!hasServerEmojis && selectedGuild && (
            <span style={{ color: "var(--muted)", fontWeight: 400, marginLeft: "6px", textTransform: "none", letterSpacing: "normal" }}>
              (no custom emojis found in this server — using defaults)
            </span>
          )}
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          {/* Yes */}
          <div>
            <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "4px", letterSpacing: "0.08em" }}>YES</div>
            <select value={emojiYes} onChange={e => setEmojiYes(e.target.value)}>
              <option value="👍">👍 Thumbs Up</option>
              <option value="✅">✅ Check Mark</option>
              <option value="⚡">⚡ Lightning</option>
              {hasServerEmojis && <optgroup label="── Server Emojis ──">
                {serverEmojis.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </optgroup>}
            </select>
            <div style={{ marginTop: "4px", fontSize: "18px", textAlign: "center" }}>
              {emojiYes.startsWith("<:") ? "🖼️" : emojiYes}
            </div>
          </div>

          {/* Maybe */}
          <div>
            <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "4px", letterSpacing: "0.08em" }}>MAYBE</div>
            <select value={emojiMaybe} onChange={e => setEmojiMaybe(e.target.value)}>
              <option value="〰️">〰️ Wavy Dash</option>
              <option value="❓">❓ Question Mark</option>
              <option value="🤔">🤔 Thinking</option>
              {hasServerEmojis && <optgroup label="── Server Emojis ──">
                {serverEmojis.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </optgroup>}
            </select>
            <div style={{ marginTop: "4px", fontSize: "18px", textAlign: "center" }}>
              {emojiMaybe.startsWith("<:") ? "🖼️" : emojiMaybe}
            </div>
          </div>

          {/* No */}
          <div>
            <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "4px", letterSpacing: "0.08em" }}>NO</div>
            <select value={emojiNo} onChange={e => setEmojiNo(e.target.value)}>
              <option value="👎">👎 Thumbs Down</option>
              <option value="❌">❌ Cross Mark</option>
              <option value="🚫">🚫 No Entry</option>
              {hasServerEmojis && <optgroup label="── Server Emojis ──">
                {serverEmojis.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </optgroup>}
            </select>
            <div style={{ marginTop: "4px", fontSize: "18px", textAlign: "center" }}>
              {emojiNo.startsWith("<:") ? "🖼️" : emojiNo}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          background: saving ? "var(--border)" : "var(--accent)",
          color: saving ? "var(--muted)" : "white",
          border: "none", borderRadius: "6px",
          padding: "10px 20px", fontSize: "11px",
          fontWeight: 700, letterSpacing: "0.08em",
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "Saving…" : "Save Discord Settings"}
      </button>

      {result && (
        <p style={{ fontSize: "12px", color: result.ok ? "#3fb950" : "var(--accent)" }}>
          {result.msg}
        </p>
      )}
    </div>
  );
}

