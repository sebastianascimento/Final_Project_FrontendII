import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: '%s | SeuApp - Sistema de Gestão',
    default: 'SeuApp - Sistema de Gestão  de produtos',
  },
  description: 'Sistema completo de gestão empresarial. Gerencie pedidos, produtos e clientes em um único lugar.',
  keywords: ['sistema de gestão' , 'ecormece ', 'gestão empresarial' , 'products' , 'pedidos' , 'clientes'],
  openGraph: {
    title: 'BizControl - Sistema de Gestão Multiempresa',
    description: 'Gerencie sua empresa com facilidade usando nosso sistema de gestão de produtos',
    url: 'https://bizcontrol.com',
    siteName: 'BizControl',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://bizcontrol .com/og-image.jpg', 
        width: 1200,
        height: 630,
        alt: 'BizControl- Sistema de Gestão',
      },
    ],
  },
  // Configurações para o Twitter
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