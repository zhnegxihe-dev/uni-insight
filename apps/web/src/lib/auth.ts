import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { safeParse } from "./format";

const COOKIE_NAME = "uni_token";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "uni-insight-dev-secret");

export interface SessionUser {
  id: string;
  email: string;
  nickname: string;
  level: number;
  starScore: number;
  verifiedSchools: string[];
}

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.uid as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== "active") return null;
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      level: user.level,
      starScore: user.starScore,
      verifiedSchools: safeParse<string[]>(user.verifiedSchools, []),
    };
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
