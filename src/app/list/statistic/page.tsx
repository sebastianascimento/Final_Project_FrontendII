// [2025-03-14 16:50:10] @sebastianascimento - Página de estatísticas com suporte multi-tenant
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Menu from "../../components/dashboard/Menu";
import Navbar from "../../components/dashboard/Navbar";
import { prisma } from "@/app/lib/prisma";
import MonthlyOrderChartContainer from "@/app/components/stats/MonthlyOrderChartContainer";

// Definindo interfaces para tipagem
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

const StatisticsPage = async () => {
  // Data e usuário atual conforme solicitado
  const currentDate = "2025-03-14 16:50:10";
  const currentUser = "sebastianascimento";

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return <p className="text-red-500">Acesso negado! Faça login primeiro.</p>;
  }

  // MULTI-TENANT: Obter ID e nome da empresa do usuário logado
  const companyId = session.user.companyId;
  const companyName = session.user.companyName || "Sua Empresa";

  // Verificar se o usuário tem uma empresa associada
  if (!companyId) {
    return (
      <div className="h-screen flex">
        <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4">
          <Link href="/" className="flex items-center justify-center lg:justify-start gap-2">
            <span className="hidden lg:block font-bold">BizControl</span>
          </Link>
          <Menu />
        </div>
        <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col p-4">
          <Navbar />
          <div className="bg-white p-8 rounded-md flex-1 m-4 mt-0">
            <div className="max-w-md mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-yellow-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          </div>
        </div>
      </div>
    );
  }

  console.log(`[2025-03-14 16:50:10] @sebastianascimento - Buscando estatísticas para empresa: ${companyId}`);

  // Abordagem para buscar produtos mais vendidos COM FILTRO DE EMPRESA
  let topProducts: Array<{ id: number; name: string; total_sold: number; totalRevenue: number }> = [];
  try {
    // 1. Buscar todos os pedidos agrupados por produto - COM FILTRO DE EMPRESA
    const productGroups = await prisma.order.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
      where: {
        companyId // MULTI-TENANT: Filtrar apenas pedidos da empresa
      }
    });

    console.log(`[2025-03-14 16:50:10] @sebastianascimento - Encontrados ${productGroups.length} grupos de produtos para empresa ${companyId}`);

    // 2. Ordenar manualmente os resultados por quantidade em ordem decrescente
    const sortedProducts = [...productGroups].sort(
      (a, b) => (b._sum.quantity || 0) - (a._sum.quantity || 0)
    );

    // 3. Pegar apenas os primeiros 5
    const top5Products = sortedProducts.slice(0, 5);

    // 4. Buscar detalhes dos produtos
    topProducts = await Promise.all(
      top5Products.map(async (item) => {
        // MULTI-TENANT: Buscar produtos apenas desta empresa
        const product = await prisma.product.findFirst({
          where: { 
            id: item.productId,
            companyId // MULTI-TENANT: Verificar que produto pertence a esta empresa
          },
        });

        if (!product) {
          console.log(`[2025-03-14 16:50:10] @sebastianascimento - Produto ID ${item.productId} não encontrado para empresa ${companyId}`);
          return {
            id: 0,
            name: "Produto não encontrado",
            total_sold: 0,
            totalRevenue: 0
          };
        }

        // Buscar todos os pedidos deste produto para calcular receita - COM FILTRO DE EMPRESA
        const orders = await prisma.order.findMany({
          where: {
            productId: item.productId,
            companyId // MULTI-TENANT: Filtrar apenas pedidos da empresa
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

        // Calcular o valor total gerado por este produto
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

    // Filtrar produtos inválidos (podem ocorrer com dados inconsistentes)
    topProducts = topProducts.filter(product => product.id !== 0);
    
  } catch (error) {
    console.error(`[2025-03-14 16:50:10] @sebastianascimento - Erro ao buscar produtos mais vendidos para empresa ${companyId}:`, error);
  }

  // Buscar os clientes que mais compram - COM FILTRO DE EMPRESA
  let topCustomers: TopCustomer[] = [];
  try {
    // 1. Buscar todos os pedidos agrupados por cliente - COM FILTRO DE EMPRESA
    const customerGroups = await prisma.order.groupBy({
      by: ["customerId"],
      _count: {
        id: true, // Conta o número de pedidos
      },
      where: {
        companyId // MULTI-TENANT: Filtrar apenas pedidos da empresa
      }
    });

    console.log(`[2025-03-14 16:50:10] @sebastianascimento - Encontrados ${customerGroups.length} grupos de clientes para empresa ${companyId}`);

    // 2. Ordenar manualmente os resultados por quantidade de pedidos
    const sortedCustomers = [...customerGroups].sort(
      (a, b) => (b._count.id || 0) - (a._count.id || 0)
    );

    // 3. Pegar apenas os primeiros 5 clientes
    const topCustomerIds = sortedCustomers
      .slice(0, 5)
      .map((item) => item.customerId);

    // 4. Buscar detalhes completos dos clientes - COM FILTRO DE EMPRESA
    topCustomers = await Promise.all(
      topCustomerIds.map(async (customerId) => {
        // Buscar detalhes do cliente - COM FILTRO DE EMPRESA
        const customer = await prisma.customer.findFirst({
          where: { 
            id: customerId,
            companyId // MULTI-TENANT: Verificar que cliente pertence a esta empresa
          },
        });

        if (!customer) {
          console.log(`[2025-03-14 16:50:10] @sebastianascimento - Cliente ID ${customerId} não encontrado para empresa ${companyId}`);
          return {
            id: 0,
            name: "Cliente não encontrado",
            totalOrders: 0,
            totalSpent: 0
          };
        }

        // Buscar todos os pedidos deste cliente - COM FILTRO DE EMPRESA
        const orders = await prisma.order.findMany({
          where: {
            customerId: customerId,
            companyId // MULTI-TENANT: Filtrar apenas pedidos da empresa
          },
          include: {
            product: {
              select: {
                price: true,
              },
            },
          },
        });

        // Calcular o número total de pedidos
        const totalOrders = orders.length;

        // Calcular o valor total gasto
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

    // Filtrar clientes inválidos (podem ocorrer com dados inconsistentes)
    topCustomers = topCustomers.filter(customer => customer.id !== 0);
    
  } catch (error) {
    console.error(`[2025-03-14 16:50:10] @sebastianascimento - Erro ao buscar clientes que mais compram para empresa ${companyId}:`, error);
  }

  return (
    <div className="h-screen flex">
      {/* LEFT - Sidebar */}
      <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4">
        <Link
          href="/"
          className="flex items-center justify-center lg:justify-start gap-2"
        >
          <span className="hidden lg:block font-bold">BizControl</span>
        </Link>
        <Menu />
      </div>

      {/* RIGHT - Main content */}
      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col p-4">
        <Navbar />

        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">
              Statistics Dashboard
              <span className="ml-2 text-sm font-normal text-gray-500">({companyName})</span>
            </h1>
          </div>
          
          {/* 1. Produtos mais vendidos */}
          <div className="mb-6 bg-white rounded-md p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              Best-selling products
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
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
          </div>

          {/* 2. Clientes que Mais Compram */}
          <div className="mb-6 bg-white rounded-md p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Best customers</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
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
          </div>

          {/* 3. Gráfico de pedidos mensais - PASSANDO O COMPANYID */}
          <div className="mb-6 bg-white rounded-md p-4 shadow-sm">
            <div className="h-[350px]">
              <MonthlyOrderChartContainer companyId={companyId} />
            </div>
          </div>
          
          {/* Rodapé com informações da empresa */}
          <div className="text-xs text-gray-500 text-right mt-4 border-t pt-2">
            <span>Atualizado em: {currentDate} por {currentUser}</span>
            <span className="ml-2 px-2 py-1 bg-gray-100 rounded">Empresa: {companyName} (ID: {companyId})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;