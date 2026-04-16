import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cinder Roll Call",
  description: "Post roll-call messages to Discord",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-border/60">
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
              <a href="/" className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                <span className="font-semibold tracking-wide">CINDER</span>
                <span className="text-muted text-sm">roll call</span>
              </a>
              <nav className="flex gap-4 text-sm text-muted">
                <a href="/" className="hover:text-text transition-colors">Post</a>
                <a href="/admin" className="hover:text-text transition-colors">Admin</a>
              </nav>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
