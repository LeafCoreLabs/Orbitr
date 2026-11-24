import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Pages that strictly require an active authenticated session
const PROTECTED_PAGE_PREFIXES = [
  "/drive",
  "/vault",
  "/shared",
  "/drop-zones",
  "/trash",
  "/security",
  "/settings",
];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const secret = process.env.AUTH_SECRET || "orbitr-auth-secret-min-32-chars-long-development";

  // Check for NextAuth / Auth.js session JWT (supports HTTPS Secure cookies and HTTP localhost cookies)
  let token = await getToken({ req, secret });
  if (!token) {
    token = await getToken({
      req,
      secret,
      secureCookie: true,
      cookieName: "__Secure-authjs.session-token",
    });
  }
  if (!token) {
    token = await getToken({
      req,
      secret,
      secureCookie: false,
      cookieName: "authjs.session-token",
    });
  }
  if (!token) {
    token = await getToken({
      req,
      secret,
      secureCookie: true,
      cookieName: "__Secure-next-auth.session-token",
    });
  }
  if (!token) {
    token = await getToken({
      req,
      secret,
      secureCookie: false,
      cookieName: "next-auth.session-token",
    });
  }

  const isAuthenticated = Boolean(token);

  // 1. Guard Protected Web App Page Routes
  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Guard Protected API Endpoints
  if (pathname.startsWith("/api/")) {
    // Endpoints that are strictly management and require authentication:
    const isProtectedApi =
      pathname.startsWith("/api/files") ||
      pathname.startsWith("/api/folders") ||
      pathname.startsWith("/api/security") ||
      pathname.startsWith("/api/tags") ||
      pathname === "/api/shares" || // listing or creating user shares
      pathname === "/api/drop-zones" || // listing or creating user drop zones
      (pathname.startsWith("/api/auth/passkey") &&
        !pathname.includes("generate-authentication-options") &&
        !pathname.includes("verify-authentication"));

    if (isProtectedApi && !isAuthenticated) {
      return NextResponse.json(
        {
          error: "Unauthorized. Authentication required to access Orbitr resources.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
