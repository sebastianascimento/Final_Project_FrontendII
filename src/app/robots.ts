import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',  
          '/api/',
          '/admin/',
        ],
      },
    ],
    sitemap: 'https://seudominio.com/sitemap.xml',
  };
}