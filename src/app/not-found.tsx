"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';

export default function NotFound() {
  const { status } = useSession();
  const router = useRouter();
  
  const [visitorInfo, setVisitorInfo] = useState({
    referrer: '',
    userAgent: '',
    timestamp: new Date().toISOString()
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVisitorInfo({
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    }
  }, []);
  
  useEffect(() => {
    if (status === "loading") return;
    
    const timeout = setTimeout(() => {
      if (status === "authenticated") {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [status, router]);

  const companyName = "InvControl";
  const pageTitle = `Página não encontrada | ${companyName}`;
  const pageDescription = "A página solicitada não existe ou foi movida para outro endereço.";
  const canonicalUrl = "https://invcontrol.com/404";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": pageTitle,
    "description": pageDescription,
    "publisher": {
      "@type": "Organization",
      "name": companyName,
      "logo": {
        "@type": "ImageObject",
        "url": "https://invcontrol.com/logo.png"
      }
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": companyName,
      "url": "https://invcontrol.com"
    }
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content="https://invcontrol.com/og-image.jpg" />
        <meta property="og:site_name" content={companyName} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="https://invcontrol.com/twitter-image.jpg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="language" content="Portuguese" />
        <meta name="revisit-after" content="7 days" />
        <meta name="author" content={companyName} />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Página não encontrada</h2>
          <p className="text-gray-500 mb-6">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="mt-8 text-sm text-gray-500">
            {status === "loading" ? (
              <p>Verificando informações...</p>
            ) : status === "authenticated" ? (
              <p>Redirecionando para o Dashboard em alguns segundos...</p>
            ) : (
              <p>Redirecionando para a página inicial em alguns segundos...</p>
            )}
            
            <div className="mt-3 w-full bg-gray-200 h-1 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-1 animate-progress"></div>
            </div>
          </div>
          
          <div className="mt-6 text-xs text-gray-400">
            Sistema: InvControl
          </div>
        </div>
      </div>
    </>
  );
}