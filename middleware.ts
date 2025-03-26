import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname === '/signin' ||
    request.nextUrl.pathname === '/signup' ||
    request.nextUrl.pathname === '/setup-company' ||
    request.nextUrl.pathname.startsWith('/setup-company')
  ) {
    return NextResponse.next();
  }
  
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  if (!token) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }
  
  if (!token.companyId) {
    return NextResponse.redirect(new URL('/setup-company', request.url));
  }
  
  const response = NextResponse.next();
  

  response.headers.set('x-tenant-id', token.companyId as string);
  response.headers.set('x-user-email', token.email as string);
  
  return response;
}


export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile',
    '/list/:path*',
    '/create/:path*',
    '/edit/:path*',
    '/',
    '/api/list/:path*',
    '/api/create/:path*',
    '/api/update/:path*',
    '/api/delete/:path*',
  ],
};