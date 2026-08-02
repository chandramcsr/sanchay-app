import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Everything except the marketing/sign-in surface requires a session.
// New routes default to protected -- an explicitly-listed public route
// is the exception, not the other way around, which matters for a
// finance app: a route that's accidentally left unprotected is a data
// leak, not just a broken feature.
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
