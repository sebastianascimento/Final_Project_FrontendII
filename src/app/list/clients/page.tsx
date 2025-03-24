import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Menu from "../../components/dashboard/Menu";
import Navbar from "../../components/dashboard/Navbar";
import TableSearch from "../../components/products/TableSearch";
import Pagination from "@/app/components/products/Pagination";
import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";
import { ITEM_PER_PAGE } from "@/app/lib/setting";
import FormModal from "../../components/FormModal";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Clientes | BizControl - Sistema de Gestão de Produtos',
  description: 'Gerencie todos os clientes da sua empresa. Visualize contatos, endereços e histórico de pedidos em um único lugar.',
  keywords: ['gerenciamento de clientes', 'cadastro de clientes', 'CRM', 'relacionamento com cliente', 'contatos'],
  openGraph: {
    title: 'Gerenciamento de Clientes - BizControl',
    description: 'Sistema completo para gestão de clientes da sua empresa',
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

interface CustomerData {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    orders: number;
  };
}

interface CustomerListData {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  numberOfItems: number;
  itemListElement: {
    "@type": string;
    position: number;
    item: {
      "@type": string;
      name: string;
      email: string;
      address: {
        "@type": string;
        streetAddress: string;
      };
    };
  }[];
}

async function getSearchParams(params: any) {
  return params;
}

const CustomersPage = async ({
  searchParams
}: {
  searchParams: { 
    page?: string;
    search?: string;
  }
}) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  if (!session.user.companyId) {
    redirect('/setup-company');
  }

  const companyId = session.user.companyId;

  const awaitedParams = await getSearchParams(searchParams);
  const page = Number(awaitedParams.page || "1");
  const currentPage = Math.max(1, page);
  const searchTerm = awaitedParams.search || "";

  let where: Prisma.CustomerWhereInput = {
    companyId: companyId 
  };
  
  if (searchTerm) {
    where = {
      ...where,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } },
        { email: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } },
        { address: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } },
      ]
    };
  }

  const take = ITEM_PER_PAGE;
  const skip = ITEM_PER_PAGE * (currentPage - 1);

  const jsonLdData: CustomerListData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Lista de Clientes",
    "description": "Gerenciamento de clientes da empresa",
    "numberOfItems": 0,
    "itemListElement": []
  };

  try {
    const data = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      },
      take,
      skip,
    });

    const count = await prisma.customer.count({ where });

    jsonLdData.numberOfItems = count;
    jsonLdData.itemListElement = data.map((customer, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Person",
        "name": customer.name,
        "email": customer.email,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": customer.address
        }
      }
    }));

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

          <main className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col p-4 pt-8">
            <header>
              <Navbar />
            </header>
            
            <div className="h-6" aria-hidden="true"></div>

            <section className="bg-white p-4 rounded-md flex-1 m-4 mt-12">
              <div className="flex items-center justify-between">
                <h1 className="hidden md:block text-lg font-semibold">
                  All Customers
                </h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                  <TableSearch initialValue={searchTerm} />
                  <div className="flex items-center gap-4 self-end">
                    <FormModal table="customer" type="create" />
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" aria-label="Lista de Clientes">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Email
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Address
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Orders
                      </th>
                      <th scope="col" className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center">
                          <p className="text-gray-500">
                            Nenhum cliente encontrado
                          </p>
                        </td>
                      </tr>
                    ) : (
                      data.map((customer) => (
                        <tr
                          key={customer.id}
                          className="border-b border-gray-200 even:bg-gray-50 text-sm hover:bg-lamaPurpleLight"
                        >
                          <td className="p-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                #{customer.id}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {customer.name}
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            {customer.email}
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            {customer.address}
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            {customer._count.orders}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <FormModal
                                table="customer"
                                type="update"
                                data={customer}
                                id={customer.id}
                              />
                              <FormModal
                                table="customer"
                                type="delete"
                                id={customer.id}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <Pagination page={currentPage} count={count} />
            </section>
          </main>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error loading customers:", error);
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 bg-gray-50" role="alert" aria-live="assertive">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg w-full">
          <h1 className="text-xl font-bold text-red-600 mb-2">Erro ao carregar clientes</h1>
          <p className="text-gray-600">Ocorreu um problema ao carregar os dados. Por favor, tente novamente mais tarde.</p>
          <Link href="/dashboard" className="inline-block mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }
};

export default CustomersPage;