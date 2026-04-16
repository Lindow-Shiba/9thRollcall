import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type Session = {
  user?: {
    id: string;          // Discord user ID
    username: string;
    avatar: string | null;
    canPost: boolean;    // has a POSTER_ROLE_IDS role in the configured guild
  };
  admin?: boolean;       // has authenticated via the admin password
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "dev-secret-at-least-32-chars-long-xxxxxx",
  cookieName: "cinder_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 60 * 60 * 12, // 12 hours
  },
};

export async function getSession() {
  return getIronSession<Session>(cookies(), sessionOptions);
}
