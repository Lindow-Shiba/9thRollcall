import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "9th AC Roll Call",
  description: "9th Assault Corps — Roll Call System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header style={{ background: "#0d1117", borderBottom: "1px solid #1e2938" }}>
            <div className="max-w-5xl mx-auto px-6 flex items-center justify-between" style={{ height: "56px" }}>
              <a href="/" className="site-logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/9_logo.png" alt="9th AC" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
                <div>
                  <div className="logo-title">9TH ASSAULT CORPS</div>
                  <div className="logo-sub">ROLL CALL SYSTEM</div>
                </div>
              </a>
              <nav className="flex items-center gap-1">
                <a href="/" className="nav-link">POST</a>
                <a href="/events" className="nav-link">EVENTS</a>
                <a href="/admin" className="nav-link">ADMIN</a>
              </nav>
            </div>
          </header>

          <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
            {children}
          </main>

          <footer style={{ borderTop: "1px solid #1e2938", padding: "16px 24px", textAlign: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", letterSpacing: "0.08em" }}>
              9TH ASSAULT CORPS · ROLL CALL SYSTEM
            </span>
          </footer>
        </div>
      </body>
    </html>
  );
}
