/**
 * Discord OAuth + webhook POST helpers.
 *
 * We intentionally don't pull in a Discord SDK for two OAuth endpoints and one
 * webhook POST — keeps the serverless bundle tiny.
 */

const DISCORD_API = "https://discord.com/api/v10";
const OAUTH_SCOPES = "identify guilds.members.read";

export function authorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID ?? "",
    response_type: "code",
    redirect_uri: redirectUri,
    scope: OAUTH_SCOPES,
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params}`;
}

export async function exchangeCode(code: string, redirectUri: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}> {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID ?? "",
    client_secret: process.env.DISCORD_CLIENT_SECRET ?? "",
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function fetchUser(accessToken: string): Promise<{
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`fetchUser failed: ${res.status}`);
  return res.json();
}

export async function fetchMemberRoles(accessToken: string, guildId: string): Promise<string[]> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds/${guildId}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { roles?: string[] };
  return data.roles ?? [];
}

export function hasPosterRole(roleIds: string[]): boolean {
  const allowed = (process.env.POSTER_ROLE_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length === 0) return false;
  return roleIds.some((r) => allowed.includes(r));
}

/**
 * POST a roll-call message to a Discord webhook.
 *
 * We let Discord render timestamps locally for each viewer via <t:unix:F> tags,
 * which is the same technique used in the screenshot you shared. No per-user
 * timezone conversion needed on our side.
 */
export async function postRollCall(
  webhookUrl: string,
  opts: {
    title: string;
    description?: string;
    opTimeUnix: number;
    pingRoleId?: string | null;
    squadLines?: string[];
    authorName: string;
  }
): Promise<void> {
  const { title, description, opTimeUnix, pingRoleId, squadLines, authorName } = opts;

  const lines: string[] = [];
  if (pingRoleId) lines.push(`<@&${pingRoleId}>`);
  lines.push(`## ${title}`);
  if (description) lines.push(description);
  lines.push("");
  lines.push(`🗓️  <t:${opTimeUnix}:F>  (<t:${opTimeUnix}:R>)`);
  lines.push("");
  lines.push(`React: 👍 yes   👎 no   〰️ maybe`);
  if (squadLines && squadLines.length > 0) {
    lines.push("");
    lines.push("**Squads**");
    for (const l of squadLines) lines.push(l);
  }
  lines.push("");
  lines.push(`-# posted by ${authorName}`);

  const payload = {
    content: lines.join("\n"),
    allowed_mentions: {
      // Only allow the specific role to be pinged, nothing else.
      parse: [] as string[],
      roles: pingRoleId ? [pingRoleId] : [],
    },
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Webhook POST failed: ${res.status} ${text}`);
  }
}
