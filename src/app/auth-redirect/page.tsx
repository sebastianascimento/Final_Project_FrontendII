// This is the server component that handles metadata
import { Metadata } from 'next';
import AuthRedirectClient from './auth-redirect-client';

// Metadata export is allowed in server components (the default in Next.js App Router)
export const metadata: Metadata = {
  title: 'Redirecionando... | BizControl',
  description: 'Aguarde enquanto te direcionamos para a página correta.',
  robots: 'noindex, nofollow', 
};

// Server component that renders the client component
export default function AuthRedirectPage() {
  return <AuthRedirectClient />;
}