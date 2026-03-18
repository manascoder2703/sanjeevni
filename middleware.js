import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET });
  const sanjeevniToken = req.cookies.get('sanjeevni_token')?.value;
  const session = token || sanjeevniToken;
  const { pathname } = req.nextUrl;

  // 1. If user is logged in and trying to access landing/auth pages
  if (session) {
    if (pathname === '/doctors') {
       return NextResponse.redirect(new URL('/dashboard/patient/doctors', req.url));
    }
    if (pathname === '/admin') {
       return NextResponse.redirect(new URL('/dashboard/admin', req.url));
    }
    if (pathname === '/login' || pathname.startsWith('/signup') || pathname.startsWith('/register')) {
      const role = token?.role || 'patient'; 
      const dashboardUrl = new URL(`/dashboard/${role}`, req.url);
      if (role === 'admin') dashboardUrl.pathname = '/admin';
      
      const response = NextResponse.redirect(dashboardUrl);
      response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      return response;
    }
  }

  // 2. Protect dashboard/admin routes from unauthenticated users
  if (!session) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
