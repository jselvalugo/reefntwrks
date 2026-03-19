import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isPortalRoute = nextUrl.pathname.startsWith("/portal");
  const isAuthRoute = nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/forgot-password") ||
    nextUrl.pathname.startsWith("/reset-password");

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    if (role === "admin") return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    return NextResponse.redirect(new URL("/portal/dashboard", nextUrl));
  }

  // Protect admin routes
  if (isAdminRoute) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Protect portal routes
  if (isPortalRoute) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
    "/login",
    "/forgot-password",
    "/reset-password",
  ],
};
