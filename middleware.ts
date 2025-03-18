// [2025-03-14 14:56:27] @sebastianascimento - Middleware para multi-tenant
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Ignorar rotas públicas
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
  
  // Obter o token JWT
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Se não está autenticado, redirecionar para login
  if (!token) {
    console.log(`[2025-03-14 14:56:27] @sebastianascimento - Usuário não autenticado tentando acessar ${request.nextUrl.pathname}`);
    return NextResponse.redirect(new URL('/signin', request.url));
  }
  
  // Se não tem companyId, redirecionar para setup
  if (!token.companyId) {
    console.log(`[2025-03-14 14:56:27] @sebastianascimento - Usuário ${token.email} sem companyId`);
    return NextResponse.redirect(new URL('/setup-company', request.url));
  }
  
  // Prosseguir com o request e adicionar headers úteis
  const response = NextResponse.next();
  

  response.headers.set('x-tenant-id', token.companyId as string);
  response.headers.set('x-user-email', token.email as string);
  
  return response;
}


export const config = {
  matcher: [
    // Rotas das páginas
    '/dashboard/:path*',
    '/profile',
    '/list/:path*',
    '/create/:path*',
    '/edit/:path*',
    '/',
    // Rotas das APIs que precisam de proteção
    '/api/list/:path*',
    '/api/create/:path*',
    '/api/update/:path*',
    '/api/delete/:path*',
  ],
};