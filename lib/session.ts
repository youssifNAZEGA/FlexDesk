import { cookies } from "next/headers";
import { db } from "./db";
import { profiles } from "./drizzle/schema";
import { eq } from "drizzle-orm";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export function createCookieSession(user: { id: string; name: string }) {
  const cookieStore = cookies();
  const sessionId = `${user.id}-${Date.now()}`;
  cookieStore.set("flexdesk-session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return sessionId;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get("flexdesk-session")?.value;

    if (!sessionId) return null;

    // Simple session validation - in production, use signed cookies + JWT
    const [userId] = sessionId.split("-");
    
    const user = await db
      .select({ id: profiles.id, firstName: profiles.first_name, email: profiles.email })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (user.length === 0) return null;

    return {
      id: user[0].id,
      name: user[0].firstName,
      email: user[0].email,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Middleware-like function for server components
export async function authenticateServerComponent() {
  const user = await getCurrentUser();
  if (!user) {
    // In a real app, redirect to login
    return null;
  }
  return user;
}