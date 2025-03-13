import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";

async function getTopSellingProducts(limit = 10) {
  // Buscar todos os pedidos e agregar por produto
  const productSales = await prisma.order.groupBy({
    by: ['productId'],
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc'  // Valor correto - usando 'desc' em vez de true
      },
    },
    take: limit,
    where: {
      // Opcional: filtrar apenas pedidos entregues ou enviados
      status: {
        in: ['DELIVERED', 'SHIPPED'],
      },
    },
  });

  // Buscar detalhes dos produtos
  const topProducts = await Promise.all(
    productSales.map(async (sale) => {
      // Buscar detalhes do produto, incluindo todos os campos necessários
      const product = await prisma.product.findUnique({
        where: { id: sale.productId as number },
        select: {
          id: true,
          name: true,
          price: true,
          // Nota: se 'image' não existe no modelo, remova esta linha:
          // image: true
        }
      });

      // Buscar todos os pedidos deste produto para calcular receita
      const orders = await prisma.order.findMany({
        where: {
          productId: sale.productId as number,
          // Opcional: filtrar apenas pedidos entregues ou enviados
          status: {
            in: ['DELIVERED', 'SHIPPED'],
          },
        },
        select: {
          quantity: true,
          product: {
            select: {
              price: true,
            },
          },
        },
      });

      const revenue = orders.reduce((total, order) => 
        total + ((order.product?.price || 0) * order.quantity), 0);

      const stock = await prisma.stock.findFirst({
        where: { productId: sale.productId as number },
        select: { stockLevel: true },
      });

      return {
        id: product?.id || 0,
        name: product?.name || "Produto não encontrado",
        quantitySold: sale._sum.quantity || 0,
        revenue: revenue,
        currentStock: stock?.stockLevel || 0,
        imagePlaceholder: "/placeholder-image.jpg",  
      };
    })
  );

  return topProducts;
}

export default async function TopSellingProductsTable() {
  const currentDate = "2025-03-11 16:45:33";
  const currentUser = "sebastianascimento";

  const topSellingProducts = await getTopSellingProducts(5);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">1.1 - Produtos Mais Vendidos</h3>
        <p className="text-sm text-gray-500 mt-1">
          Lista dos produtos com maior volume de vendas e suas performances
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome do produto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantidade vendida
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receita gerada
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estoque atual
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {topSellingProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {/* Substituir a referência à imagem com um ícone ou remover completamente */}
                    <div className="flex-shrink-0 h-10 w-10 mr-3 bg-gray-100 rounded-md flex items-center justify-center">
                      <span className="text-gray-500">📦</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {product.quantitySold.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    ${product.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${product.currentStock <= 5 ? 'bg-red-100 text-red-800' : 
                    product.currentStock <= 20 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'}`}>
                    {product.currentStock.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
            
            {topSellingProducts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhum produto encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Rodapé com informações de atualização */}
      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-right border-t border-gray-200">
        Atualizado em: {currentDate} por {currentUser}
      </div>
    </div>
  );
}