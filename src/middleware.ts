import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // run on everything except static assets / PWA files
    "/((?!_next/static|_next/image|favicon.ico|icons/|sounds/|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ico|html)$).*)",
  ],
};
