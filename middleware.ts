import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

export default async function middleware(req: NextRequest) {
  const { userId } = await getAuth(req);

  if (!userId && !req.url.includes('/sign-in')) {
    const signInUrl = new URL('/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }

  if (userId && req.url.includes('/sign-in')) {
    const homeUrl = new URL('/', req.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
  runtime: "nodejs",
};