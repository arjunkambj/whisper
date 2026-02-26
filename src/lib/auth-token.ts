import { jwtVerify, SignJWT } from "jose";

export const AUTH_COOKIE_NAME = "site-auth";
export const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const AUTH_ISSUER = "whisper";
const AUTH_AUDIENCE = "site-access";

const getAuthSecret = () => {
  const secret = process.env.SITE_AUTH_SECRET;
  if (!secret) {
    throw new Error("SITE_AUTH_SECRET not configured");
  }
  return new TextEncoder().encode(secret);
};

export const createAuthToken = () =>
  new SignJWT({ scope: "site" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(AUTH_ISSUER)
    .setAudience(AUTH_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${AUTH_TOKEN_TTL_SECONDS}s`)
    .sign(getAuthSecret());

export const verifyAuthToken = async (token: string) => {
  try {
    await jwtVerify(token, getAuthSecret(), {
      issuer: AUTH_ISSUER,
      audience: AUTH_AUDIENCE,
    });
    return true;
  } catch {
    return false;
  }
};
