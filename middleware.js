import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (pathname.startsWith("/admin")) {
    const isAdminLogin = pathname === "/admin/login";

    if (!token && !isAdminLogin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (token?.role !== "admin") {
      if (isAdminLogin) {
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (token?.role === "admin" && isAdminLogin) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/api/admin")) {
    if (token?.role !== "admin") {
      return NextResponse.json({ message: "Admin access required." }, { status: 403 });
    }
  }

  if (
    pathname.startsWith("/api/products") &&
    request.method !== "GET" &&
    token?.role !== "admin"
  ) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/products/:path*"],
};
