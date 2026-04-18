/**
 * Discord webhook POST helper.
 *
 * We intentionally don't pull in a Discord SDK — keeps the serverless bundle tiny.
 */

/**
 * POST a roll-call message to a Discord webhook.
 *
 * We let Discord render timestamps locally for each viewer via <t:unix:F> tags.
 * No per-user timezone conversion needed on our side.
 */
export async function postRollCall(
  webhookUrl: string,
  opts: {
    title: string;
    description?: string;
    opTimeUnix: number;
    pingRoleId?: string | null;
    squadLines?: string[];
    rsvpUrl?: string;
  }
): Promise<void> {
  const { title, description, opTimeUnix, pingRoleId, squadLines, rsvpUrl } = opts;

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
  if (rsvpUrl) {
    lines.push("");
    lines.push(`🔗 [RSVP & select your squad](${rsvpUrl})`);
  }

  const payload = {
    content: lines.join("\n"),
    allowed_mentions: {
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
