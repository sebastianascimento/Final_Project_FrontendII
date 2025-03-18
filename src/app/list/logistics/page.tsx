// [2025-03-14 15:29:04] @sebastianascimento - Página de logística com multi-tenant
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Menu from "../../components/dashboard/Menu";
import Navbar from "../../components/dashboard/Navbar";
import TableSearch from "../../components/products/TableSearch";
import Pagination from "@/app/components/products/Pagination";
import Table from "../../components/products/Table";
import Image from "next/image";
import { Prisma } from "@prisma/client";
import { ITEM_PER_PAGE } from "@/app/lib/setting";
import FormModal from "@/app/components/FormModal";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";

type ShippingWithRelations = Prisma.ShippingGetPayload<{
  include: {
    stock: {
      include: {
        product: true;
      };
    };
  };
}>;

const columns = [
  {
    header: "Product",
    accessor: "product",
  },
  {
    header: "Status",
    accessor: "status",
  },
  {
    header: "Carrier",
    accessor: "carrier",
    className: "hidden md:table-cell",
  },
  {
    header: "Est. Delivery",
    accessor: "estimatedDelivery",
  },
  {
    header: "Stock Level",
    accessor: "stockLevel",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

// Função renderRow atualizada com o estilo visual do status igual ao de orders
const renderRow = (item: ShippingWithRelations) => {
  return (
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
      <td className="p-4 hidden md:table-cell">{item.carrier}</td>
      <td className="p-4">
        {new Date(item.estimatedDelivery).toLocaleDateString()}
      </td>
      <td className="p-4">{item.stock.stockLevel}</td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <FormModal table="shipping" type="update" data={item} />
          <FormModal table="shipping" type="delete" id={item.id} />
        </div>
      </td>
    </tr>
  );
};

const LogisticsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}) => {
  const params = await searchParams;

  // Obter sessão e verificar autenticação
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    // Redirecionar para login se não estiver autenticado
    console.log("[2025-03-14 15:29:04] @sebastianascimento - Acesso não autenticado à página de logística");
    redirect('/signin');
  }

  // MULTI-TENANT: Verificar se o usuário tem uma empresa
  if (!session.user.companyId) {
    console.log("[2025-03-14 15:29:04] @sebastianascimento - Usuário sem empresa tentando acessar logística");
    redirect('/setup-company');
  }

  const companyId = session.user.companyId;
  console.log(`[2025-03-14 15:29:04] @sebastianascimento - Listando dados de logística para empresa: ${companyId}`);

  const page = Number(params.page) || 1;
  const currentPage = Math.max(1, page);
  const searchTerm = params.search;

  // MULTI-TENANT: Sempre incluir companyId nas consultas para isolamento de dados
  const where: Prisma.ShippingWhereInput = {
    companyId: companyId // CRÍTICO: Filtrar por empresa
  };

  if (searchTerm) {
    where.OR = [
      { status: { contains: searchTerm, mode: "insensitive" } },
      { carrier: { contains: searchTerm, mode: "insensitive" } },
      // Podemos adicionar busca em produtos relacionados
      { stock: { product: { name: { contains: searchTerm, mode: "insensitive" } } } }
    ];
  }

  const take = ITEM_PER_PAGE;
  const skip = ITEM_PER_PAGE * (currentPage - 1);

  try {
    // MULTI-TENANT: Buscar envios com filtragem por empresa
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
              <h1 className="hidden md:block text-lg font-semibold">
                Shipping Management
              </h1>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <TableSearch />
                <div className="flex items-center gap-4 self-end">
                  <FormModal table="shipping" type="create" />
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
    console.error(`[2025-03-14 15:29:04] @sebastianascimento - Erro ao listar dados de logística:`, error);
    
    // Exibir mensagem de erro amigável
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
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