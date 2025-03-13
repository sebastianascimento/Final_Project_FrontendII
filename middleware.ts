import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Valores constantes para logs
const CURRENT_DATE = "2025-03-13 11:48:00";
const CURRENT_USER = "sebastianascimento";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Rotas públicas que não precisam de autenticação
  const publicPaths = ['/login', '/register', '/api/auth', '/', '/api/webhooks'];
  
  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return NextResponse.next();
  }
  
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Se não estiver autenticado, redirecionar para login
  if (!session) {
    console.log(`[${CURRENT_DATE}] Unauthorized access attempt to ${path}`);
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  console.log(`[${CURRENT_DATE}] User ${CURRENT_USER} accessing ${path}`);
  
  // Adicionar cabeçalhos com informações de usuário e empresa para API routes
  if (path.startsWith('/api/')) {
    // Passa informações de contexto para as rotas da API via cabeçalhos
    const response = NextResponse.next();
    
    if (session.email) response.headers.set('X-User-Email', session.email as string);
    if (session.companyId) response.headers.set('X-Company-Id', session.companyId as string);
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/api/:path*',
    '/inventory/:path*',
    '/orders/:path*',
    '/profile/:path*'
  ],
};