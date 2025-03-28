import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: '%s | BizControl - Sistema de Gestão de Produtos',
    default: 'BizControl - Sistema de Gestão  de produtos',
  },
  description: 'Sistema completo de gestão empresarial. Gerencie pedidos, produtos e clientes em um único lugar.',
  keywords: ['sistema de gestão' , 'ecormece ', 'gestão empresarial' , 'products' , 'pedidos' , 'clientes'],
  openGraph: {
    title: 'BizControl - Sistema de Gestão Multiempresa',
    description: 'Gerencie sua empresa com facilidade usando nosso sistema de gestão de produtos',
    url: 'https://bizcontrol-kappa.vercel.app',
    siteName: 'BizControl',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://bizcontrol-kappa.vercel.app/ /icons/bizcontrol.png', 
        width: 1200,
        height: 630,
        alt: 'BizControl- Sistema de Gestão',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BizControl - Sistema de Gestão Multiempresa',
    description: 'Gerencie a sua  empresas em uma única plataforma',
    images: ['https://bizcontrol.com/twitter-image.jpg'], 
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  verification: {
    google: 'google-site-verification=seucódigo', 
  },
};