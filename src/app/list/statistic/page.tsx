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
  totalRevenue: number; // Adicionando campo para receita total
}

interface TopCustomer {
  id: number;
  name: string;
  totalOrders: number;
  totalSpent: number;
}

const StatisticsPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return <p className="text-red-500">Acesso negado! Faça login primeiro.</p>;
  }

  // Data e usuário atual atualizados conforme solicitado
  const currentDate = "2025-03-12 11:56:24";
  const currentUser = "sebastianascimento";

  // Abordagem para buscar produtos mais vendidos usando Prisma com ordenação manual
  let topProducts: Array<{ id: number; name: string; total_sold: number; totalRevenue: number }> = [];
  try {
    // 1. Buscar todos os pedidos agrupados por produto
    const productGroups = await prisma.order.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
    });

    // 2. Ordenar manualmente os resultados por quantidade em ordem decrescente
    const sortedProducts = [...productGroups].sort(
      (a, b) => (b._sum.quantity || 0) - (a._sum.quantity || 0)
    );

    // 3. Pegar apenas os primeiros 5
    const top5Products = sortedProducts.slice(0, 5);

    // 4. Buscar detalhes dos produtos
    topProducts = await Promise.all(
      top5Products.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        // Buscar todos os pedidos deste produto para calcular receita
        const orders = await prisma.order.findMany({
          where: {
            productId: item.productId,
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
          id: product?.id || 0,
          name: product?.name || "Produto não encontrado",
          total_sold: item._sum.quantity || 0,
          totalRevenue: totalRevenue,
        };
      })
    );
  } catch (error) {
    console.error("Erro ao buscar produtos mais vendidos:", error);
  }

  // Buscar os clientes que mais compram
  let topCustomers: TopCustomer[] = [];
  try {
    // 1. Buscar todos os pedidos agrupados por cliente
    const customerGroups = await prisma.order.groupBy({
      by: ["customerId"],
      _count: {
        id: true, // Conta o número de pedidos
      },
    });

    // 2. Ordenar manualmente os resultados por quantidade de pedidos
    const sortedCustomers = [...customerGroups].sort(
      (a, b) => (b._count.id || 0) - (a._count.id || 0)
    );

    // 3. Pegar apenas os primeiros 5 clientes
    const topCustomerIds = sortedCustomers
      .slice(0, 5)
      .map((item) => item.customerId);

    // 4. Buscar detalhes completos dos clientes
    topCustomers = await Promise.all(
      topCustomerIds.map(async (customerId) => {
        // Buscar detalhes do cliente
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
        });

        // Buscar todos os pedidos deste cliente
        const orders = await prisma.order.findMany({
          where: {
            customerId: customerId,
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
          id: customer?.id || 0,
          name: customer?.name || "Cliente não encontrado",
          totalOrders,
          totalSpent,
        };
      })
    );
  } catch (error) {
    console.error("Erro ao buscar clientes que mais compram:", error);
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
            <h1 className="text-xl font-bold">Statistics Dashboard</h1>
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
                        No data available
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
                        No customers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Gráfico de pedidos mensais - agora em terceiro lugar */}
          <div className="mb-6 bg-white rounded-md p-4 shadow-sm">
            <div className="h-[350px]">
              <MonthlyOrderChartContainer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;