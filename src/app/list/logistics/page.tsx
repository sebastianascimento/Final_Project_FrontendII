import { authOptions } from '@/app/api/auth/[...nextauth]/auth'
import { getServerSession } from "next-auth";
import Link from "next/link";
import Menu from "../../components/dashboard/Menu";
import Navbar from "../../components/dashboard/Navbar";
import TableSearch from "../../components/products/TableSearch";
import Pagination from "@/app/components/products/Pagination";
import { Prisma } from "@prisma/client";
import { ITEM_PER_PAGE } from "@/app/lib/setting";
import FormModal from "@/app/components/FormModal";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Logística | BizControl - Sistema de Gestão de Produtos',
  description: 'Gerencie seus envios, rastreie entregas e monitore a logística de produtos em um sistema integrado.',
  keywords: ['gestão de logística', 'rastreamento de envios', 'gestão de estoque', 'status de entrega', 'cadeia de suprimentos'],
  openGraph: {
    title: 'Gerenciamento de Logística - BizControl',
    description: 'Sistema completo para gestão de envios e operações logísticas',
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

type ShippingWithRelations = Prisma.ShippingGetPayload<{
  include: {
    stock: {
      include: {
        product: true;
      };
    };
  };
}>;

interface ShippingItem {
  "@type": string;
  identifier: string;
  carrier: string;
  deliveryStatus: string;
  expectedArrivalFrom: string;
  itemShipped: {
    "@type": string;
    name: string;
  };
}

interface ShippingListData {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  numberOfItems: number;
  itemListElement: {
    "@type": string;
    position: number;
    item: ShippingItem;
  }[];
}

async function getSearchParams(params: any) {
  return params;
}

const LogisticsPage = async ({
  searchParams,
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

  let where: Prisma.ShippingWhereInput = {
    companyId: companyId
  };

  if (searchTerm) {
    where = {
      ...where,
      OR: [
        { status: { contains: searchTerm, mode: "insensitive" as Prisma.QueryMode } },
        { carrier: { contains: searchTerm, mode: "insensitive" as Prisma.QueryMode } },
        { stock: { product: { name: { contains: searchTerm, mode: "insensitive" as Prisma.QueryMode } } } }
      ]
    };
  }

  const take = ITEM_PER_PAGE;
  const skip = ITEM_PER_PAGE * (currentPage - 1);

  const jsonLdData: ShippingListData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Lista de Envios e Logística",
    "description": "Gerenciamento de envios e operações logísticas da empresa",
    "numberOfItems": 0,
    "itemListElement": []
  };

  try {
    const data = await prisma.shipping.findMany({
      where,
      include: {
        stock: {
          include: {
            product: true,
          },
        },
      },
      take,
      skip,
      orderBy: {
        estimatedDelivery: "asc",
      },
    });

    const count = await prisma.shipping.count({ where });

    jsonLdData.numberOfItems = count;
    jsonLdData.itemListElement = data.map((shipping, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "ParcelDelivery",
        "identifier": shipping.id.toString(),
        "carrier": shipping.carrier,
        "deliveryStatus": shipping.status,
        "expectedArrivalFrom": new Date(shipping.estimatedDelivery).toISOString(),
        "itemShipped": {
          "@type": "Product",
          "name": shipping.stock.product.name
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
          {/* Sidebar - hidden on mobile */}
          <div className="hidden lg:block w-[16%] xl:w-[14%] p-4">
            <Link
              href="/"
              className="flex items-center justify-start gap-2"
              aria-label="Ir para página inicial"
            >
              <span className="font-bold">BizControl</span>
            </Link>
            <Menu />
          </div>

          {/* Mobile menu container */}
          <div className="lg:hidden">
            <Menu />
          </div>

          {/* Main content area - full width on mobile */}
          <main className="w-full lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-auto flex flex-col p-3 sm:p-4 pt-12 sm:pt-8">
            <header>
              <Navbar />
            </header>
            
            <div className="h-6" aria-hidden="true"></div>

            <section className="bg-white p-3 sm:p-4 rounded-md flex-1 mx-auto w-full max-w-screen-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h1 className="text-lg font-semibold text-center sm:text-left">
                  Shipping Management
                </h1>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <TableSearch initialValue={searchTerm} />
                  <div className="flex items-center gap-3 sm:gap-4 self-center sm:self-end">
                    <FormModal table="shipping" type="create" />
                  </div>
                </div>
              </div>

              {/* Mobile view for shipping items */}
              <div className="mt-4 block sm:hidden">
                {data.length === 0 ? (
                  <div className="text-center p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-500">Nenhum envio encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.map((item) => (
                      <div key={item.id} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-semibold">{item.stock.product.name}</div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                            ${item.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                            item.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'PROCESSING' ? 'bg-purple-100 text-purple-800' :
                            item.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><span className="text-gray-500">Carrier:</span> {item.carrier}</p>
                          <p><span className="text-gray-500">Est. Delivery:</span> {new Date(item.estimatedDelivery).toLocaleDateString()}</p>
                          <p><span className="text-gray-500">Stock Level:</span> {item.stock.stockLevel}</p>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <FormModal table="shipping" type="update" data={item} id={item.id} />
                          <FormModal table="shipping" type="delete" id={item.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop view for shipping items */}
              <div className="mt-6 overflow-x-auto hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200" aria-label="Lista de Envios e Logística">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Carrier
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Est. Delivery
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Level
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
                            Nenhum envio encontrado
                          </p>
                        </td>
                      </tr>
                    ) : (
                      data.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-200 even:bg-gray-50 text-sm hover:bg-lamaPurpleLight"
                        >
                          <td className="p-4">{item.stock.product.name}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${item.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                              item.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                              item.status === 'PROCESSING' ? 'bg-purple-100 text-purple-800' :
                              item.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-4">{item.carrier}</td>
                          <td className="p-4">
                            {new Date(item.estimatedDelivery).toLocaleDateString()}
                          </td>
                          <td className="p-4">{item.stock.stockLevel}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <FormModal
                                table="shipping"
                                type="update"
                                data={item}
                                id={item.id}
                              />
                              <FormModal
                                table="shipping"
                                type="delete"
                                id={item.id}
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
    console.error(`[${new Date().toISOString()}] @sebastianascimento - Error loading logistics data:`, error);
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 bg-gray-50" role="alert" aria-live="assertive">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg w-full">
          <h1 className="text-xl font-bold text-red-600 mb-2">Erro ao carregar dados de logística</h1>
          <p className="text-gray-600">Ocorreu um problema ao carregar as informações de envio. Por favor, tente novamente mais tarde.</p>
          <Link href="/dashboard" className="inline-block mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }
};

export default LogisticsPage;