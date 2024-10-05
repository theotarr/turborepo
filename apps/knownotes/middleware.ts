export { auth as middleware } from "@acme/auth";

// Middleware only runs when the requested url starts with these paths.
export const config = {
  matcher: ["/dashboard/:path*", "/chat/:path*", "/login", "/register"],
};
