import { NextRequest } from "next/server";

export function getRpId(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost";
  return host.split(":")[0];
}

export function getExpectedOrigin(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export function getAllowedOrigins(req: NextRequest): string[] {
  const current = getExpectedOrigin(req);
  const origins = new Set<string>([
    current,
    "https://orbitr-theta.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) {
    const domain = host.split(":")[0];
    origins.add(`https://${domain}`);
    origins.add(`http://${domain}`);
    origins.add(`https://${host}`);
    origins.add(`http://${host}`);
  }
  return Array.from(origins);
}
