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
  title: 'Orders | BizControl - Sistema de Gestão de Produtos',
  description: 'Gerencie todos os pedidos da sua empresa. Acompanhe status, visualize clientes e produtos em um único lugar.',
  keywords: ['gerenciamento de pedidos', 'processamento de pedidos', 'rastreamento de pedidos', 'status de pedido', 'vendas'],
  openGraph: {
    title: 'Gerenciamento de Pedidos - BizControl',
    description: 'Sistema completo para gestão de pedidos da sua empresa',
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

interface OrderData {
  id: number;
  quantity: number;
  address: string | null;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  customerId?: number;
  productId?: number;
  companyId?: string;
  customer?: {
    id: number;
    name: string;
    email: string;
    address: string;
  } | null;
  product?: {
    id: number;
    name: string;
    description: string | null;
    price: number;
    categoryId: number;
    brandId: number;
    supplierId: number;
  } | null;
}

interface OrderOffer {
  "@type": string;
  price: string;
  priceCurrency: string;
}

interface OrderItem {
  "@type": string;
  orderedItem: {
    "@type": string;
    name: string;
  };
  orderQuantity: number;
  orderItemStatus: string;
}

interface OrderObject {
  "@type": string;
  orderNumber: string;
  orderStatus: string;
  customer: {
    "@type": string;
    name: string;
  };
  orderedItem: OrderItem[];
  totalPaymentDue: {
    "@type": string;
    price: string;
    priceCurrency: string;
  }
}

interface OrderListData {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  numberOfItems: number;
  itemListElement: {
    "@type": string;
    position: number;
    item: OrderObject;
  }[];
}

async function getSearchParams(params: any) {
  return params;
}

const OrdersPage = async ({
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

  let where: Prisma.OrderWhereInput = {
    companyId: companyId 
  };

  if (searchTerm) {
    where = {
      ...where, 
      OR: [
        { customer: { name: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } } },
        { product: { name: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } } },
      ]
    };
  }

  const take = ITEM_PER_PAGE;
  const skip = ITEM_PER_PAGE * (currentPage - 1);

  const jsonLdData: OrderListData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Lista de Pedidos",
    "description": "Gerenciamento de pedidos da empresa",
    "numberOfItems": 0,
    "itemListElement": []
  };

  try {
    const data = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            address: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          }
        },
      },
      orderBy: {
        id: 'desc'
      },
      take,
      skip,
    });

    const count = await prisma.order.count({ where });

    jsonLdData.numberOfItems = count;
    jsonLdData.itemListElement = data.map((order, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Order",
        "orderNumber": order.id.toString(),
        "orderStatus": order.status,
        "customer": {
          "@type": "Person",
          "name": order.customer?.name || "Cliente não especificado"
        },
        "orderedItem": [
          {
            "@type": "OrderItem",
            "orderedItem": {
              "@type": "Product",
              "name": order.product?.name || "Produto não especificado"
            },
            "orderQuantity": order.quantity,
            "orderItemStatus": order.status
          }
        ],
        "totalPaymentDue": {
          "@type": "PriceSpecification",
          "price": ((order.product?.price || 0) * order.quantity).toFixed(2),
          "priceCurrency": "USD"
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
                  All Orders
                </h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                  <TableSearch initialValue={searchTerm} />
                  <div className="flex items-center gap-4 self-end">
                    <FormModal table="order" type="create" />
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" aria-label="Lista de Pedidos">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Number
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Customer Name
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Product
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Quantity
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Total Amount
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Status
                      </th>
                      <th scope="col" className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center">
                          <p className="text-gray-500">
                            Nenhum pedido encontrado
                          </p>
                        </td>
                      </tr>
                    ) : (
                      data.map((order) => {
                        const totalAmount = ((order.product?.price || 0) * order.quantity).toFixed(2);
                        
                        return (
                          <tr
                            key={order.id}
                            className="border-b border-gray-200 even:bg-gray-50 text-sm hover:bg-lamaPurpleLight"
                          >
                            <td className="p-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  #{order.id}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              {order.customer?.name || "N/A"}
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              {order.product?.name || "N/A"}
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              {order.quantity}
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              ${totalAmount}
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                                order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <FormModal
                                  table="order"
                                  type="update"
                                  data={order}
                                  id={order.id}
                                />
                                <FormModal
                                  table="order"
                                  type="delete"
                                  id={order.id}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })
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
    console.error("Error loading orders:", error);
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 bg-gray-50" role="alert" aria-live="assertive">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg w-full">
          <h1 className="text-xl font-bold text-red-600 mb-2">Erro ao carregar pedidos</h1>
          <p className="text-gray-600">Ocorreu um problema ao carregar os pedidos. Por favor, tente novamente mais tarde.</p>
          <Link href="/dashboard" className="inline-block mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }
};

export default OrdersPage;