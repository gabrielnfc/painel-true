import { authMiddleware } from '@clerk/nextjs/server';

export default authMiddleware({
  publicRoutes: ["/sign-in"],
  ignoredRoutes: ["/api/webhook"],
  afterAuth(auth, req, evt) {
    if (req.url.includes('/sign-up')) {
      return Response.redirect(new URL('/sign-in', req.url));
    }

    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return Response.redirect(signInUrl);
    }

    if (auth.userId && req.url.includes('/sign-in')) {
      return Response.redirect(new URL('/', req.url));
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
  runtime: "nodejs",
};