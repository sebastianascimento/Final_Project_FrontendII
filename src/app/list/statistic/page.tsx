import { authOptions } from '@/app/api/auth/[...nextauth]/auth'
import { getServerSession } from "next-auth";
import Link from "next/link";
import Menu from "../../components/dashboard/Menu";
import Navbar from "../../components/dashboard/Navbar";
import { prisma } from "@/app/lib/prisma";
import MonthlyOrderChartContainer from "@/app/components/stats/MonthlyOrderChartContainer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Estatísticas | BizControl - Sistema de Gestão de Produtos',
  description: 'Visualize métricas de desempenho do seu negócio. Analise produtos mais vendidos, melhores clientes e tendências de vendas mensais.',
  keywords: ['estatísticas de negócio', 'análise de vendas', 'dashboard', 'métricas de desempenho', 'relatórios'],
  openGraph: {
    title: 'Dashboard de Estatísticas - BizControl',
    description: 'Visualize dados analíticos e métricas de desempenho do seu negócio',
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

interface TopSellingProduct {
  id: number;
  name: string;
  total_sold: number | bigint;
  totalRevenue: number;
}

interface TopCustomer {
  id: number;
  name: string;
  totalOrders: number;
  totalSpent: number;
}

interface DatasetItem {
  "@type": string;
  name: string;
  description: string;
  variableMeasured: string[];
}

interface StatisticsData {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  dateCreated: string;
  creator: {
    "@type": string;
    name: string;
  };
  hasPart: DatasetItem[];
}

const StatisticsPage = async () => {
  const currentDate = "2025-03-25 19:36:28";
  const currentUser = "sebastianascimento";

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return <p className="text-red-500">Acesso negado! Faça login primeiro.</p>;
  }

  const companyId = session.user.companyId;
  const companyName = session.user.companyName || "Sua Empresa";

  if (!companyId) {
    return (
      <div className="h-screen flex">
        <div className="hidden lg:block w-[16%] xl:w-[14%] p-4">
          <Link href="/" className="flex items-center justify-start gap-2">
            <span className="font-bold">BizControl</span>
          </Link>
          <Menu />
        </div>

        <div className="lg:hidden">
          <Menu />
        </div>

        <main className="w-full lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-auto flex flex-col p-3 sm:p-4 pt-12 sm:pt-8">
          <header>
            <Navbar />
          </header>
          <section className="bg-white p-5 sm:p-8 rounded-md flex-1 m-2 sm:m-4 mt-8">
            <div className="max-w-md mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-yellow-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Configuração de Empresa Necessária</h1>
              <p className="mb-6 text-gray-600">
                Você precisa configurar sua empresa antes de acessar as estatísticas.
                Isso permite que visualizemos dados relevantes para o seu negócio.
              </p>
              <Link 
                href="/setup-company" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Configurar Empresa
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const jsonLdData: StatisticsData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "Dashboard de Estatísticas de Negócio",
    "description": "Dados analíticos de desempenho para a empresa",
    "dateCreated": new Date().toISOString(),
    "creator": {
      "@type": "Organization",
      "name": companyName
    },
    "hasPart": [
      {
        "@type": "Dataset",
        "name": "Produtos Mais Vendidos",
        "description": "Análise dos 5 produtos mais vendidos da empresa",
        "variableMeasured": ["nome do produto", "quantidade vendida", "receita total"]
      },
      {
        "@type": "Dataset",
        "name": "Melhores Clientes",
        "description": "Análise dos 5 melhores clientes por volume de compras",
        "variableMeasured": ["nome do cliente", "total de pedidos", "valor total gasto"]
      },
      {
        "@type": "Dataset",
        "name": "Tendências de Vendas Mensais",
        "description": "Gráfico de pedidos mensais ao longo do tempo",
        "variableMeasured": ["mês", "quantidade de pedidos"]
      }
    ]
  };

  let topProducts: Array<{ id: number; name: string; total_sold: number; totalRevenue: number }> = [];
  try {
    const productGroups = await prisma.order.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
      where: {
        companyId 
      }
    });

    const sortedProducts = [...productGroups].sort(
      (a, b) => (b._sum.quantity || 0) - (a._sum.quantity || 0)
    );

    const top5Products = sortedProducts.slice(0, 5);

    topProducts = await Promise.all(
      top5Products.map(async (item) => {
        const product = await prisma.product.findFirst({
          where: { 
            id: item.productId,
            companyId 
          },
        });

        if (!product) {
          return {
            id: 0,
            name: "Produto não encontrado",
            total_sold: 0,
            totalRevenue: 0
          };
        }

        const orders = await prisma.order.findMany({
          where: {
            productId: item.productId,
            companyId 
          },
          select: {
            quantity: true,
            product: {
              select: {
                price: true,
              }
            }
          }
        });

        const totalRevenue = orders.reduce((total, order) => 
          total + ((order.product?.price || 0) * order.quantity), 0);

        return {
          id: product.id,
          name: product.name,
          total_sold: item._sum.quantity || 0,
          totalRevenue: totalRevenue,
        };
      })
    );

    topProducts = topProducts.filter(product => product.id !== 0);
    
  } catch (error) {
    console.error(`[${currentDate}] @${currentUser} - Error fetching top products:`, error);
  }

  let topCustomers: TopCustomer[] = [];
  try {
    const customerGroups = await prisma.order.groupBy({
      by: ["customerId"],
      _count: {
        id: true, 
      },
      where: {
        companyId 
      }
    });

    const sortedCustomers = [...customerGroups].sort(
      (a, b) => (b._count.id || 0) - (a._count.id || 0)
    );

    const topCustomerIds = sortedCustomers
      .slice(0, 5)
      .map((item) => item.customerId);

    topCustomers = await Promise.all(
      topCustomerIds.map(async (customerId) => {
        const customer = await prisma.customer.findFirst({
          where: { 
            id: customerId,
            companyId 
          },
        });

        if (!customer) {
          return {
            id: 0,
            name: "Cliente não encontrado",
            totalOrders: 0,
            totalSpent: 0
          };
        }

        const orders = await prisma.order.findMany({
          where: {
            customerId: customerId,
            companyId
          },
          include: {
            product: {
              select: {
                price: true,
              },
            },
          },
        });

        const totalOrders = orders.length;

        const totalSpent = orders.reduce(
          (total, order) =>
            total + (order.product?.price || 0) * order.quantity,
          0
        );

        return {
          id: customer.id,
          name: customer.name,
          totalOrders,
          totalSpent,
        };
      })
    );

    topCustomers = topCustomers.filter(customer => customer.id !== 0);
    
  } catch (error) {
    console.error(`[${currentDate}] @${currentUser} - Error fetching top customers:`, error);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />
      
      <div className="h-screen flex">
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

        <div className="lg:hidden">
          <Menu />
        </div>

        <main className="w-full lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-auto flex flex-col p-3 sm:p-4 pt-12 sm:pt-8">
          <header>
            <Navbar />
            <h1 className="sr-only">Dashboard de Estatísticas e Análises de Negócio</h1>
          </header>

          <div className="h-4 sm:h-6" aria-hidden="true"></div>

          <section className="bg-white p-2 sm:p-4 rounded-md flex-1 mx-auto w-full max-w-screen-xl">
            <header className="flex items-center justify-between mb-3 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-center sm:text-left w-full">
                Statistics Dashboard
              </h2>
            </header>
            
            <section className="mb-4 sm:mb-6 bg-white rounded-md p-2 sm:p-4 shadow-sm" aria-labelledby="best-products-heading">
              <h3 id="best-products-heading" className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">
                Best-selling products
              </h3>

              <div className="block sm:hidden">
                {topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {topProducts.map((product) => (
                      <div key={product.id} className="bg-gray-50 p-3 rounded-md">
                        <div className="font-medium text-gray-900 mb-1">{product.name}</div>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-gray-500">Total Sold:</span> {product.total_sold}
                          </p>
                          <p>
                            <span className="text-gray-500">Revenue:</span> ${product.totalRevenue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-500">Nenhum dado de venda encontrado para sua empresa</p>
                  </div>
                )}
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" aria-describedby="products-table-desc">
                  <caption id="products-table-desc" className="sr-only">
                    Lista dos produtos mais vendidos com quantidade e receita
                  </caption>
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Total Sold
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Total Amount Spent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topProducts.length > 0 ? (
                      topProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.total_sold}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${product.totalRevenue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          Nenhum dado de venda encontrado para sua empresa
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-3 sm:mb-6 bg-white rounded-md p-2 sm:p-4 shadow-sm" aria-labelledby="best-customers-heading">
              <h3 id="best-customers-heading" className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Best customers</h3>

              <div className="block sm:hidden">
                {topCustomers.length > 0 ? (
                  <div className="space-y-3">
                    {topCustomers.map((customer) => (
                      <div key={customer.id} className="bg-gray-50 p-3 rounded-md">
                        <div className="font-medium text-gray-900 mb-1">{customer.name}</div>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-gray-500">Orders:</span> {customer.totalOrders}
                          </p>
                          <p>
                            <span className="text-gray-500">Total Spent:</span> ${customer.totalSpent.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-500">Nenhum cliente encontrado para sua empresa</p>
                  </div>
                )}
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" aria-describedby="customers-table-desc">
                  <caption id="customers-table-desc" className="sr-only">
                    Lista dos melhores clientes com quantidade de pedidos e valor gasto
                  </caption>
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Customer name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Total number of orders
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Total amount spent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topCustomers.length > 0 ? (
                      topCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {customer.totalOrders}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              $
                              {customer.totalSpent.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          Nenhum cliente encontrado para sua empresa
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-4 sm:mb-6 bg-white rounded-md shadow-sm px-4 py-6 sm:p-6" aria-labelledby="monthly-chart-heading">
              <h3 id="monthly-chart-heading" className="hidden sm:block text-base sm:text-lg font-semibold mb-4 sm:mb-6">Monthly Order Trends</h3>
              <div className="h-[300px] sm:h-[400px] w-full">
                <MonthlyOrderChartContainer/>
              </div>
            </section>
          </section>
        </main>
      </div>
    </>
  );
};

export default StatisticsPage;