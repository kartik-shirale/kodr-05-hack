import { NextRequest, NextResponse } from "next/server";

export const TEACHER_ROUTES = ["/dashboard", "/tests"];
export const STUDENT_EXAM_ROUTES = ["/exam"];
export const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

export function isRouteMatch(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Route protection proxy based on cookie existence.
 * Does not decode/verify JWT on every edge hop; checks that auth cookies exist
 * and redirects to the appropriate login page.
 * Individual protected layouts then verify identity with GET /auth/me.
 */
export function handleAuthProxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const isAuthenticated = Boolean(accessToken || refreshToken);

  // 1. Teacher routes protection
  if (isRouteMatch(pathname, TEACHER_ROUTES)) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      const nextPath = `${pathname}${search}`;
      if (nextPath !== "/") {
        loginUrl.searchParams.set("next", nextPath);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Student exam routes protection (/exam/lobby, /exam/room, /exam/done)
  if (isRouteMatch(pathname, STUDENT_EXAM_ROUTES)) {
    if (!isAuthenticated) {
      // If student is not authenticated, redirect to /login or root
      const joinUrl = new URL("/login", request.url);
      return NextResponse.redirect(joinUrl);
    }
  }

  // 3. Prevent logged-in users from hitting login/register if already authenticated
  if (isRouteMatch(pathname, AUTH_ROUTES) && isAuthenticated) {
    const next = request.nextUrl.searchParams.get("next");
    const redirectUrl = new URL(next && next.startsWith("/") ? next : "/dashboard", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export default function proxy(request: NextRequest) {
  return handleAuthProxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

