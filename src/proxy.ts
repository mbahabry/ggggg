import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login", "/403"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth");

  if (isPublic) return NextResponse.next();

  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Drivers may only access the driver portal and shared routes.
  const role = req.auth.user.role;
  const isDriverPortal = pathname === "/driver" || pathname.startsWith("/driver/");
  if (role === "DRIVER" && !isDriverPortal) {
    return NextResponse.redirect(new URL("/driver", req.nextUrl.origin));
  }
  if (role !== "DRIVER" && isDriverPortal) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
