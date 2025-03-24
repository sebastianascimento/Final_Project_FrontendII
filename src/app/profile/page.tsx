import { Metadata } from "next";
import ProfileClient from "../components/profile/ProfileClient";

export const metadata: Metadata = {
  title: 'Meu Perfil | BizControl - Sistema de Gestão de Produtos',
  description: 'Gerencie suas informações pessoais, configurações de conta e preferências no sistema BizControl.',
  keywords: ['perfil de usuário', 'configurações de conta', 'informações pessoais', 'preferências de usuário'],
  openGraph: {
    title: 'Meu Perfil - BizControl',
    description: 'Gerencie suas informações pessoais e configurações de conta',
    type: 'profile',
    locale: 'pt_BR',
    siteName: 'BizControl',
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

interface PersonData {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  dateModified: string;
  mainEntityOfPage: {
    "@type": string;
    "@id": string;
  };
}

export default function ProfilePage() {
  const currentDateTime = "2025-03-24 12:13:04";
  
  const jsonLdData: PersonData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "name": "Perfil de Usuário BizControl",
    "description": "Página de perfil e configurações pessoais no sistema de gestão BizControl",
    "dateModified": new Date(currentDateTime).toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://yourwebsite.com/profile"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />
      
      <ProfileClient />
    </>
  );
}