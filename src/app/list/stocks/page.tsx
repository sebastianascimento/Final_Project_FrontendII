// [2025-03-14 16:30:07] @sebastianascimento - Página de Estoques com suporte Multi-Tenant
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
import StockRow from "@/app/components/stocks/StockRow";

const columns = [
  {
    header: "ID",
    accessor: "id",
  },
  {
    header: "Product",
    accessor: "product",
  },
  {
    header: "Stock Level",
    accessor: "stockLevel",
  },
  {
    header: "Supplier",
    accessor: "supplier",
    className: "hidden md:table-cell",
  },
  {
    header: "Shipments",
    accessor: "shipments",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const StocksPage = async ({
  searchParams
}: {
  searchParams: { 
    page?: string;
    search?: string;
  }
}) => {
  const session = await getServerSession(authOptions);
  const currentDate = "2025-03-14 16:30:07";
  const currentUser = "sebastianascimento";

  if (!session || !session.user) {
    return <p className="text-red-500">Acesso negado! Faça login primeiro.</p>;
  }

  // MULTI-TENANT: Obter ID da empresa do usuário
  const companyId = session.user.companyId;
  
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
              <h1 className="text-2xl font-bold text-red-600 mb-4">Configuração de Empresa Necessária</h1>
              <p className="mb-6">
                Você precisa configurar sua empresa antes de gerenciar estoques.
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

  console.log(`[2025-03-14 16:30:07] @sebastianascimento - Listando estoques para empresa: ${companyId}`);

  const page = Number(searchParams.page) || 1;
  const currentPage = Math.max(1, page);
  const searchTerm = searchParams.search;

  // MULTI-TENANT: Adicionar companyId às condições de busca
  let where: Prisma.StockWhereInput = {
    companyId // Filtrar apenas estoques da empresa do usuário
  };
  
  if (searchTerm) {
    where = {
      ...where,
      OR: [
        { product: { name: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } } },
        { supplier: { name: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } } },
      ]
    };
  }

  const take = ITEM_PER_PAGE;
  const skip = ITEM_PER_PAGE * (currentPage - 1);

  try {
    // Buscar dados de estoque com relações - FILTRADO POR EMPRESA
    const data = await prisma.stock.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          }
        },
        supplier: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            shippings: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      },
      take,
      skip,
    });

    const count = await prisma.stock.count({ where });
    
    console.log(`[2025-03-14 16:30:07] @sebastianascimento - Encontrados ${count} registros de estoque para empresa ${companyId}`);

    // Obter nome da empresa
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true }
    });

    const companyName = company?.name || "Sua Empresa";

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
                Inventory Management 
                <span className="text-sm font-normal text-gray-500 ml-2">({companyName})</span>
              </h1>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <TableSearch />
                <div className="flex items-center gap-4 self-end">
                  <FormModal table="stock" type="create" />
                </div>
              </div>
            </div>

            {/* Renderizando a tabela diretamente com linhas cliente */}
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    {columns.map((column, index) => (
                      <th 
                        key={index} 
                        className={`py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${column.className || ''}`}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <StockRow key={item.id} item={item} />
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                        No stock records found for your company
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <Pagination page={currentPage} count={count} />
            
            {/* Adicionar um rodapé com data e usuário */}
            <div className="text-xs text-gray-500 mt-4 text-right">
              Last updated: {currentDate} by {currentUser}
              <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">Company ID: {companyId}</span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error(`[2025-03-14 16:30:07] @sebastianascimento - Erro ao buscar estoques:`, error);
    
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
            <div className="p-4 mb-4 text-red-700 bg-red-100 border-l-4 border-red-500">
              <p className="font-bold">Erro ao carregar dados</p>
              <p>Ocorreu um problema ao buscar os registros de estoque. Por favor, tente novamente mais tarde.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default StocksPage;