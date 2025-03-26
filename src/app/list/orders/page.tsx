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
                  All Orders
                </h1>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <TableSearch initialValue={searchTerm} />
                  <div className="flex items-center gap-3 sm:gap-4 self-center sm:self-end">
                    <FormModal table="order" type="create" />
                  </div>
                </div>
              </div>

              {/* Mobile view for orders */}
              <div className="mt-4 block sm:hidden">
                {data.length === 0 ? (
                  <div className="text-center p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-500">Nenhum pedido encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.map((order) => {
                      const totalAmount = ((order.product?.price || 0) * order.quantity).toFixed(2);
                      return (
                        <div key={order.id} className="bg-gray-50 p-3 rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-semibold">Order #{order.id}</div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                              ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                              order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-sm space-y-1">
                            <p><span className="text-gray-500">Customer:</span> {order.customer?.name || "N/A"}</p>
                            <p><span className="text-gray-500">Product:</span> {order.product?.name || "N/A"}</p>
                            <p><span className="text-gray-500">Quantity:</span> {order.quantity}</p>
                            <p><span className="text-gray-500">Amount:</span> ${totalAmount}</p>
                          </div>
                          <div className="flex justify-end gap-2 mt-3">
                            <FormModal table="order" type="update" data={order} id={order.id} />
                            <FormModal table="order" type="delete" id={order.id} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Desktop view for orders */}
              <div className="mt-6 overflow-x-auto hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200" aria-label="Lista de Pedidos">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Number
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                            <td className="p-4">
                              {order.customer?.name || "N/A"}
                            </td>
                            <td className="p-4">
                              {order.product?.name || "N/A"}
                            </td>
                            <td className="p-4">
                              {order.quantity}
                            </td>
                            <td className="p-4">
                              ${totalAmount}
                            </td>
                            <td className="p-4">
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