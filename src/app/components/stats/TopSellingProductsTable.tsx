// [2025-03-14 16:42:50] @sebastianascimento - Tabela de produtos mais vendidos com suporte multi-tenant
import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getTopSellingProducts(companyId: string | null, limit = 10) {
  if (!companyId) {
    console.log("[2025-03-14 16:42:50] @sebastianascimento - Tentativa de buscar produtos sem companyId");
    return [];
  }

  try {
    console.log(`[2025-03-14 16:42:50] @sebastianascimento - Buscando top ${limit} produtos vendidos para empresa ${companyId}`);
    
    // Buscar todos os pedidos e agregar por produto - COM FILTRO DE EMPRESA
    const productSales = await prisma.order.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        },
      },
      take: limit,
      where: {
        companyId, // MULTI-TENANT: Filtrar por empresa
        status: {
          in: ['DELIVERED', 'SHIPPED'],
        },
      },
    });

    console.log(`[2025-03-14 16:42:50] @sebastianascimento - Encontrados ${productSales.length} produtos com vendas para empresa ${companyId}`);

    // Buscar detalhes dos produtos
    const topProducts = await Promise.all(
      productSales.map(async (sale) => {
        // Buscar detalhes do produto, incluindo todos os campos necessários - COM FILTRO DE EMPRESA
        const product = await prisma.product.findFirst({
          where: { 
            id: sale.productId as number,
            companyId // MULTI-TENANT: Garantir que é da mesma empresa
          },
          select: {
            id: true,
            name: true,
            price: true,
          }
        });

        // Buscar todos os pedidos deste produto para calcular receita - COM FILTRO DE EMPRESA
        const orders = await prisma.order.findMany({
          where: {
            productId: sale.productId as number,
            companyId, // MULTI-TENANT: Filtrar por empresa
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

        // Buscar estoque - COM FILTRO DE EMPRESA
        const stock = await prisma.stock.findFirst({
          where: { 
            productId: sale.productId as number,
            companyId // MULTI-TENANT: Filtrar por empresa
          },
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
  } catch (error) {
    console.error(`[2025-03-14 16:42:50] @sebastianascimento - Erro ao buscar produtos mais vendidos:`, error);
    return [];
  }
}

export default async function TopSellingProductsTable() {
  const currentDate = "2025-03-14 16:42:50";
  const currentUser = "sebastianascimento";

  // MULTI-TENANT: Obter ID da empresa do usuário
  const session = await getServerSession(authOptions);
  const companyId = session?.user?.companyId;
  const companyName = session?.user?.companyName || "Sua Empresa";
  
  // Se o usuário não tiver uma empresa configurada, mostrar mensagem apropriada
  if (!companyId) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">1.1 - Produtos Mais Vendidos</h3>
          <p className="text-sm text-gray-500 mt-1">
            Lista dos produtos com maior volume de vendas e suas performances
          </p>
        </div>
        
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Configuração Necessária</h3>
          <p className="text-gray-600 mb-4">
            Configure sua empresa primeiro para ver os produtos mais vendidos.
          </p>
          <a 
            href="/setup-company" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Configurar Empresa
          </a>
        </div>
        
        <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-right border-t border-gray-200">
          Atualizado em: {currentDate} por {currentUser}
        </div>
      </div>
    );
  }

  const topSellingProducts = await getTopSellingProducts(companyId, 5);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          1.1 - Produtos Mais Vendidos
          <span className="text-sm font-normal text-gray-500 ml-2">({companyName})</span>
        </h3>
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
                  Nenhum produto vendido encontrado para sua empresa
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Rodapé com informações de atualização */}
      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-right border-t border-gray-200">
        <span>Atualizado em: {currentDate} por {currentUser}</span>
        <span className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs">Empresa: {companyName}</span>
      </div>
    </div>
  );
}