import { getSession } from "@/lib/session";
import { supabaseAdmin, type Platoon, type Squad, type Webhook } from "@/lib/supabase";
import { RollCallForm } from "@/components/RollCallForm";

export const dynamic = "force-dynamic"; // don't cache — session-dependent

export default async function HomePage() {
  const session = await getSession();

  if (!session.user) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <h1 className="text-3xl font-semibold mb-3">Sign in</h1>
        <p className="text-muted mb-8">
          Log in with Discord. You must hold an authorised role to post roll calls.
        </p>
        <a
          href="/api/auth/login"
          className="inline-block bg-accent hover:bg-accentHover text-white font-medium px-6 py-3 rounded-md transition-colors"
        >
          Continue with Discord
        </a>
      </div>
    );
  }

  if (!session.user.canPost) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">Not authorised</h1>
        <p className="text-muted mb-6">
          You&rsquo;re logged in as <span className="text-text">{session.user.username}</span>,
          but you don&rsquo;t hold a role permitted to post roll calls.
        </p>
        <a href="/api/auth/logout" className="text-muted hover:text-text underline text-sm">
          Log out
        </a>
      </div>
    );
  }

  // Load platoons, squads, webhooks
  const sb = supabaseAdmin();
  const [pRes, sRes, wRes] = await Promise.all([
    sb.from("platoons").select("*").order("name"),
    sb.from("squads").select("*").order("sort_order"),
    sb.from("webhooks").select("id,platoon_id,label,created_at").order("label"),
  ]);

  const platoons = (pRes.data as Platoon[]) ?? [];
  const squads = (sRes.data as Squad[]) ?? [];
  // Intentionally omit the `url` field from what we ship to the client.
  const webhooks = (wRes.data as Omit<Webhook, "url">[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">New roll call</h1>
          <p className="text-muted text-sm mt-1">
            Signed in as {session.user.username}
          </p>
        </div>
        <a href="/api/auth/logout" className="text-muted hover:text-text text-sm underline">
          Log out
        </a>
      </div>

      {platoons.length === 0 ? (
        <div className="panel p-6 bg-panel border border-border rounded-lg">
          <p className="text-muted">
            No platoons configured yet. Ask an admin to set one up at{" "}
            <a href="/admin" className="text-accent hover:underline">/admin</a>.
          </p>
        </div>
      ) : (
        <RollCallForm platoons={platoons} squads={squads} webhooks={webhooks} />
      )}
    </div>
  );
}
