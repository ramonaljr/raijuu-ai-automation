import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isClientRoute = createRouteMatcher(['/app(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.redirect(new URL('/sign-in', req.url));
    const role = (sessionClaims?.publicMetadata as any)?.role;
    if (role !== 'admin') return new NextResponse('Forbidden', { status: 403 });
  }

  if (isClientRoute(req)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.redirect(new URL('/sign-in', req.url));
    const role = (sessionClaims?.publicMetadata as any)?.role;
    if (role !== 'client' && role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
