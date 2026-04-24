import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isValidCredential } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { username?: string; password?: string } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request payload." },
      { status: 400 }
    );
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!isValidCredential(username, password)) {
    return NextResponse.json(
      { ok: false, message: "Invalid username or password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true, user: { name: "Ceo", role: "Admin" } });

  response.cookies.set(AUTH_COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
