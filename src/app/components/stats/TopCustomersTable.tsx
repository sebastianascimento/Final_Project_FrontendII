import { prisma } from "@/app/lib/prisma";

async function getTopCustomers(limit = 5) {
  // Buscar todos os pedidos agrupados por cliente
  const customerGroups = await prisma.order.groupBy({
    by: ['customerId'],
    _count: {
      id: true, // Conta o número de pedidos
    },
  });

  // Ordenar manualmente os resultados por quantidade de pedidos
  const sortedCustomers = [...customerGroups].sort((a, b) => 
    (b._count.id || 0) - (a._count.id || 0)
  );

  // Pegar apenas os primeiros N clientes
  const topCustomerIds = sortedCustomers.slice(0, limit).map(item => item.customerId);

  // Buscar detalhes completos dos clientes
  const topCustomersWithDetails = await Promise.all(
    topCustomerIds.map(async (customerId) => {
      // Buscar detalhes do cliente
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
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
            }
          }
        }
      });

      // Calcular o número total de pedidos
      const totalOrders = orders.length;
      
      // Calcular o valor total gasto
      const totalSpent = orders.reduce((total, order) => 
        total + ((order.product?.price || 0) * order.quantity), 0);

      return {
        id: customer?.id || 0,
        name: customer?.name || "Cliente não encontrado",
        totalOrders,
        totalSpent,
      };
    })
  );

  return topCustomersWithDetails;
}

export default async function TopCustomersTable() {
  // Data e usuário atual atualizados para os valores fornecidos
  const currentDate = "2025-03-12 10:20:15";
  const currentUser = "sebastianascimento";

  // Buscar os clientes que mais compraram
  const topCustomers = await getTopCustomers(5);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Top Customers</h3>
        <p className="text-sm text-gray-500 mt-1">
          Customers with the highest purchase volume and spending
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Orders
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount Spent
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {topCustomers.length > 0 ? (
              topCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
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
                      ${customer.totalSpent.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Rodapé com informações de atualização */}
      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-right border-t border-gray-200">
        Last updated: {currentDate} by {currentUser}
      </div>
    </div>
  );
}