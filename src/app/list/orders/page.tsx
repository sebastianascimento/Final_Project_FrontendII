import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Menu from "../../components/dashboard/Menu";
import Navbar from "../../components/dashboard/Navbar";
import TableSearch from "../../components/products/TableSearch";
import Pagination from "@/app/components/products/Pagination";
import Table from "../../components/products/Table";
import Image from "next/image";
import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";
import { ITEM_PER_PAGE } from "@/app/lib/setting";
import FormModal from "../../components/FormModal";
import { redirect } from "next/navigation";

interface OrderData {
  id: number;
  quantity: number;
  address: string | null;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  customerId?: number;
  productId?: number;
  companyId?: string; // Adicionado campo companyId
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

const columns = [
  {
    header: "Order Number",
    accessor: "id",
  },
  {
    header: "Customer Name",
    accessor: "customerName",
    className: "hidden md:table-cell",
  },
  {
    header: "Product",
    accessor: "productName", 
    className: "hidden md:table-cell",
  },
  {
    header: "Quantity",
    accessor: "quantity",
    className: "hidden md:table-cell",
  },
  {
    header: "Total Amount",
    accessor: "totalAmount",
    className: "hidden md:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const renderRow = (item: OrderData) => {
  // Calcular o valor total
  const totalAmount = ((item.product?.price || 0) * item.quantity).toFixed(2);

  return (
    <tr key={item.id} className="border-b border-gray-200 even:bg-gray-50 text-sm hover:bg-lamaPurpleLight">
      <td className="p-4">#{item.id}</td>
      <td className="hidden md:table-cell">{item.customer?.name || "N/A"}</td>
      <td className="hidden md:table-cell">{item.product?.name || "N/A"}</td>
      <td className="hidden md:table-cell">{item.quantity}</td>
      <td className="hidden md:table-cell">${totalAmount}</td>
      <td className="hidden md:table-cell">
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${item.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
          item.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
          item.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'}`}>
          {item.status}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <FormModal 
            table="order" 
            type="update" 
            data={item} 
            id={item.id} 
          />
          <FormModal 
            table="order" 
            type="delete" 
            id={item.id} 
          />
        </div>
      </td>
    </tr>
  );
};

const OrdersPage = async ({
  searchParams
}: {
  searchParams: { 
    page?: string;
    search?: string;
  }
}) => {
  // Obter sessão para verificar autenticação e empresa
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    // Redirecionar para login se não estiver autenticado
    redirect('/signin');
  }

  // MULTI-TENANT: Verificar se o usuário tem uma empresa
  if (!session.user.companyId) {
    console.log("[2025-03-14 15:09:00] @sebastianascimento - Usuário sem empresa tentando acessar pedidos");
    redirect('/setup-company');
  }

  const companyId = session.user.companyId;
  console.log(`[2025-03-14 15:09:00] @sebastianascimento - Listando pedidos para empresa: ${companyId}`);

  const page = Number(searchParams.page) || 1;
  const currentPage = Math.max(1, page);
  const searchTerm = searchParams.search;

  // MULTI-TENANT: Sempre incluir companyId nas consultas
  let where: Prisma.OrderWhereInput = {
    companyId: companyId // CRÍTICO: Filtrar por empresa
  };

  if (searchTerm) {
    where = {
      ...where, // Manter o filtro por companyId
      OR: [
        { customer: { name: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } } },
        { product: { name: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } } },
      ]
    };
  }

  const take = ITEM_PER_PAGE;
  const skip = ITEM_PER_PAGE * (currentPage - 1);

  try {
    // MULTI-TENANT: Consultas com filtragem por empresa
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
            <div className="flex items-center justify-between">
              <h1 className="hidden md:block text-lg font-semibold">All Orders</h1>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <TableSearch />
                <div className="flex items-center gap-4 self-end">
                  <FormModal table="order" type="create" />
                </div>
              </div>
            </div>

            <Table columns={columns} renderRow={renderRow} data={data} />
            <Pagination page={currentPage} count={count} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error(`[2025-03-14 15:09:00] @sebastianascimento - Erro ao listar pedidos:`, error);
    
    // Exibir mensagem de erro amigável
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
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