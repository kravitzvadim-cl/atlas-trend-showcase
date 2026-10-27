import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";

// Everything, pages and API alike, sits behind the password when SITE_PASSWORD is set.
export function middleware(req: NextRequest) {
  if (isAuthorized(req.headers.get("authorization"), process.env.SITE_PASSWORD)) return NextResponse.next();
  return new NextResponse("Atlas Trend is private. Ask the owner for the password.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Atlas Trend", charset="UTF-8"' },
  });
}

export const config = { matcher: "/((?!_next/static|_next/image|icon.svg).*)" };
