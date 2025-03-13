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

  if (!session || !session.user) {
    return <p className="text-red-500">Acesso negado! Faça login primeiro.</p>;
  }

  const page = Number(searchParams.page) || 1;
  const currentPage = Math.max(1, page);
  const searchTerm = searchParams.search;
  const currentDate = "2025-03-11 15:24:41";
  const currentUser = "sebastianascimento";

  // Adicione condições de busca se houver um termo de pesquisa
  let where: Prisma.StockWhereInput = {};
  if (searchTerm) {
    where = {
      OR: [
        { product: { name: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } } },
        { supplier: { name: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode } } },
      ]
    };
  }

  const take = ITEM_PER_PAGE;
  const skip = ITEM_PER_PAGE * (currentPage - 1);

  // Buscar dados de estoque com relações
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
            <h1 className="hidden md:block text-lg font-semibold">Inventory Management</h1>
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
                      No stock records found
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default StocksPage;