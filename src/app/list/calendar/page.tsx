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
  const currentDateTime = "2025-03-24 11:43:49";
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
        <nav className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4" aria-label="Menu Principal">
          <Link
            href="/"
            className="flex items-center justify-center lg:justify-start gap-2"
            aria-label="Ir para página inicial"
          >
            <span className="hidden lg:block font-bold">BizControl</span>
          </Link>
          <Menu />
        </nav>

        <main className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col p-4 pt-6">
          <header>
            <Navbar />
            <h1 className="sr-only">Calendário de Eventos e Compromissos</h1>
          </header>

          <div className="h-8" aria-hidden="true"></div>

          <section className="m-4 bg-white p-4 rounded-md shadow-lg" aria-labelledby="calendar-heading">
            <h2 id="calendar-heading" className="text-xl font-bold mb-4">
              Calendário Empresarial
              {companyName && (
                <span className="ml-2 text-sm font-normal text-gray-500">({companyName})</span>
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