import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Mission Control", charset="UTF-8"',
    },
  });
}

export function middleware(req: NextRequest) {
  // Auth gate is enabled if MC_AUTH_PASSWORD is set.
  const expectedPass = process.env.MC_AUTH_PASSWORD;
  if (!expectedPass) return NextResponse.next();

  const expectedUser = process.env.MC_AUTH_USER ?? "admin";

  const auth = req.headers.get("authorization") ?? "";
  if (!auth.toLowerCase().startsWith("basic ")) return unauthorized();

  const base64 = auth.slice(6).trim();
  if (!base64) return unauthorized();

  try {
    const decoded = atob(base64);
    const idx = decoded.indexOf(":");
    if (idx === -1) return unauthorized();

    const user = decoded.slice(0, idx);
    const pass = decoded.slice(idx + 1);

    if (user === expectedUser && pass === expectedPass) {
      return NextResponse.next();
    }

    return unauthorized();
  } catch {
    return unauthorized();
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals + favicon
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
