import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_TTL_SECONDS,
  createAuthToken,
} from "@/lib/auth-token";

export async function POST(request: Request) {
  const { password } = await request.json();
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    return Response.json(
      { error: "SITE_PASSWORD not configured" },
      { status: 500 },
    );
  }

  if (password !== sitePassword) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }

  let token = "";
  try {
    token = await createAuthToken();
  } catch {
    return Response.json(
      { error: "SITE_AUTH_SECRET not configured" },
      { status: 500 },
    );
  }

  const jar = await cookies();
  jar.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_TOKEN_TTL_SECONDS,
  });

  return Response.json({ ok: true });
}
