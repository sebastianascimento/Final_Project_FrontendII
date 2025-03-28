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
    sitemap: 'https://bizcontrol-kappa.vercel.app/sitemap.xml',
  };
}