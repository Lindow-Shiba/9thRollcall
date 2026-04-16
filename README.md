# Cinder Roll Call

Next.js app deployed on Vercel that lets authorised members post roll-call messages to Discord via webhook, with timezone-aware timestamps and squad attendance sections.

## How it works

1. Member signs in with Discord (OAuth).
2. App checks they hold one of the configured "poster" roles in the guild.
3. They fill in: title, description, op date/time, which webhook to post to, which role to ping.
4. App POSTs the message to the Discord webhook. Discord's `<t:unix:F>` timestamps auto-convert to each viewer's local time.
5. Members react in Discord (👍 / 👎 / 〰️). No tallying — just Discord's native reactions.

A separate admin page (password-gated) is used to edit platoons, squads, webhooks, and role IDs.

## Stack

- Next.js 14 (App Router)
- Supabase (Postgres) for storing platoons, squads, webhooks
- Discord OAuth (manual, no auth library — small enough to write directly)
- Deployed on Vercel
- Tailwind for styling

## Setup

### 1. Supabase

Run the SQL in `supabase/schema.sql` in your Supabase project's SQL editor. This creates the `platoons`, `squads`, and `webhooks` tables.

### 2. Discord developer portal

Create a Discord application at <https://discord.com/developers/applications>.

Under **OAuth2 → General**, add a redirect URL:

- `https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/callback`
- (and `http://localhost:3000/api/auth/callback` for local dev)

Copy the **Client ID** and **Client Secret**.

### 3. Discord webhooks

In the Discord channel(s) you want to post to, go to **channel settings → Integrations → Webhooks → New Webhook**. Copy the webhook URL. You'll add these in the admin panel.

### 4. Environment variables

Copy `.env.example` to `.env.local` for local dev, and add the same vars to Vercel project settings for production.

```
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_GUILD_ID=                  # your server ID
POSTER_ROLE_IDS=111,222            # comma-separated Discord role IDs allowed to post

NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=         # server-side only, NOT the anon key

SESSION_SECRET=                    # random 32+ byte hex string
ADMIN_PASSWORD=                    # password for the /admin page

NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

Generate a session secret with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Deploy

```
npm install
npm run dev            # local
```

Push to GitHub, import the repo in Vercel, add the env vars, deploy.

## Usage

- `/` — sign in with Discord, then post a roll call.
- `/admin` — enter the admin password, then manage platoons/squads/webhooks.

## Adding a new squad

`/admin` → pick a platoon → add a squad row → save. Shows up immediately in the post form.
