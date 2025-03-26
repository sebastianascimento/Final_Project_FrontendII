import { getServerSession } from 'next-auth';
import BigCalendar from "../../components/calendar/BigCalendar";
import Menu from "../../components/dashboard/Menu";
import Navbar from "../../components/dashboard/Navbar";
import Link from 'next/link';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Calendário | BizControl - Sistema de Gestão de Produtos',
  description: 'Visualize e gerencie eventos, entregas e compromissos do seu negócio em um calendário interativo e completo.',
  keywords: ['calendário empresarial', 'agendamento', 'planejamento', 'eventos', 'gestão de tempo'],
  openGraph: {
    title: 'Calendário de Negócios - BizControl',
    description: 'Organize sua agenda comercial e acompanhe eventos importantes da sua empresa',
    type: 'website',
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

interface CalendarData {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  image: string;
  url: string;
  startDate: string;
  endDate: string;
  eventStatus: string;
  organizer: {
    "@type": string;
    name: string;
  };
}

const CalendarPage = async () => {
  const currentDateTime = "2025-03-24 21:07:00";
  const currentUser = "sebastianascimento";
  
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return <p className="text-red-500">Acesso negado! Faça login primeiro.</p>;
  }

  const companyName = session.user.companyName || "Sua Empresa";
  const companyId = session.user.companyId;

  const jsonLdData: CalendarData = {
    "@context": "https://schema.org",
    "@type": "Schedule",
    "name": `Calendário de Negócios - ${companyName}`,
    "description": "Calendário de eventos, compromissos e prazos importantes da empresa",
    "image": "https://yourwebsite.com/images/calendar-icon.png",
    "url": "https://yourwebsite.com/list/calendar",
    "startDate": new Date().toISOString(),
    "endDate": new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    "eventStatus": "https://schema.org/EventScheduled",
    "organizer": {
      "@type": "Organization",
      "name": companyName
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />
      
      <div className="h-screen flex">
        <div className="hidden lg:block w-[10%] xl:w-[12%] p-3">
          <Link
            href="/"
            className="flex items-center justify-start gap-2"
            aria-label="Ir para página inicial"
          >
            <span className="font-bold text-sm xl:text-base">BizControl</span>
          </Link>
          <Menu />
        </div>

        <div className="lg:hidden">
          <Menu />
        </div>

        <main className="w-full lg:w-[90%] xl:w-[88%] bg-[#F7F8FA] overflow-auto flex flex-col p-3 sm:p-4 pt-12 sm:pt-8">
          <header>
            <Navbar />
            <h1 className="sr-only">Calendário de Eventos e Compromissos</h1>
          </header>

          <div className="h-4 sm:h-6" aria-hidden="true"></div>

          <section className="mx-2 sm:m-4 bg-white p-3 sm:p-4 rounded-md shadow-sm sm:shadow-md" aria-labelledby="calendar-heading">
            <h2 id="calendar-heading" className="text-lg sm:text-xl font-bold mb-2 sm:mb-4">
              Calendário Empresarial
              {companyName && (
                <span className="ml-2 text-xs sm:text-sm font-normal text-gray-500">({companyName})</span>
              )}
            </h2>
            
            <div className="calendar-container" role="application" aria-label="Calendário interativo">
              <BigCalendar />
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default CalendarPage;