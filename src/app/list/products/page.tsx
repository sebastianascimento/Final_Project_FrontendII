// [2025-03-14 12:23:34] @sebastianascimento - Correção de isolamento multi-tenant
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Menu from "../../components/dashboard/Menu";
import Navbar from "../../components/dashboard/Navbar";
import TableSearch from "../../components/products/TableSearch";
import Pagination from "@/app/components/products/Pagination";
import Table from "../../components/products/Table";
import Image from "next/image";
import FormModal from "@/app/components/FormModal";
import { Prisma, Product, Category, Brand, Supplier } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { ITEM_PER_PAGE } from "@/app/lib/setting";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

type ProductList = Product & { category: Category } & { brand: Brand } & { supplier: Supplier };

const columns = [
  { header: "Info", accessor: "info" },
  { header: "Product ID", accessor: "productId", className: "hidden md:table-cell" },
  { header: "Category", accessor: "category", className: "hidden md:table-cell" },
  { header: "Brand", accessor: "brand", className: "hidden md:table-cell" },
  { header: "Supplier", accessor: "supplier", className: "hidden lg:table-cell" },
  { header: "Price", accessor: "price", className: "hidden lg:table-cell" },
];

const renderRow = (item: ProductList) => {
  return (
    <tr key={item.id} className="border-b border-gray-200 even:bg-gray-50 text-sm hover:bg-lamaPurpleLight">
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item?.description}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.id}</td>
      <td className="hidden md:table-cell">{item.category?.name || "N/A"}</td>
      <td className="hidden md:table-cell">{item.brand?.name || "N/A"}</td>
      <td className="hidden md:table-cell">{item.supplier?.name || "N/A"}</td>
      <td className="hidden md:table-cell">{item.price}</td>
      <td>
        <div className="flex items-center gap-2">
          <FormModal table="product" type="update" id={item.id} data={item} />
          <FormModal table="product" type="delete" id={item.id} />
        </div>
      </td>
    </tr>
  );
};

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ 
    page?: string;
    categoryId?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  
  // OBTER SESSÃO E VERIFICAR AUTENTICAÇÃO
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/signin");
  }
  
  // CRÍTICO: VERIFICAR SE O USUÁRIO TEM UMA EMPRESA ASSOCIADA
  if (!session.user.companyId) {
    console.log("[2025-03-14 12:23:34] @sebastianascimento - Usuário sem empresa, redirecionando para setup");
    redirect("/setup-company");
  }
  
  // ESSENCIAL: Obter o companyId do usuário atual para isolamento multi-tenant
  const companyId = session.user.companyId;
  
  // Log para depuração
  console.log(`[2025-03-14 12:23:34] @sebastianascimento - Listando produtos para empresa: ${companyId}`);
  
  const page = Number(params.page) || 1;
  const currentPage = Math.max(1, page);
  const categoryId = params.categoryId ? Number(params.categoryId) : undefined;
  const searchTerm = params.search;
  
  // CRÍTICO: Iniciar o filtro com companyId para garantir isolamento multi-tenant
  const where: Prisma.ProductWhereInput = {
    companyId: companyId  // ESTA É A LINHA CRUCIAL - Garante isolamento por empresa
  };
  
  if (categoryId && !isNaN(categoryId)) {
    where.categoryId = categoryId;
  }
  
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } }
    ];
  }
  
  const take = ITEM_PER_PAGE;
  const skip = ITEM_PER_PAGE * (currentPage - 1);
  
  try {
    // SEGURANÇA: Agora todas as consultas respeitam o isolamento por empresa
    const data = await prisma.product.findMany({
      where,  // Inclui companyId no filtro
      include: {
        category: true,
        brand: true,
        supplier: true,
      },
      take,
      skip,
    });
    
    const count = await prisma.product.count({ where });  // Também filtrado por companyId
    
    // Log para depuração
    console.log(`[2025-03-14 12:23:34] @sebastianascimento - Encontrados ${data.length} produtos para empresa ${companyId}`);
    
    return (
      <div className="h-screen flex">
        {/* LEFT - Sidebar */}
        <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4">
          <Link href="/" className="flex items-center justify-center lg:justify-start gap-2">
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
                All Products
              </h1>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <TableSearch />
                <div className="flex items-center gap-4 self-end">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                    <Image
                      src="/icons/noavatar.png"
                      alt=""
                      width={14}
                      height={14}
                    />
                  </button>
                  <FormModal table="product" type="create" />
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
    console.error("[2025-03-14 12:23:34] @sebastianascimento - Erro ao listar produtos:", error);
    return (
      <div className="p-8">
        <h1 className="text-red-500 text-xl">Erro ao carregar produtos</h1>
        <p className="text-gray-600">Tente novamente ou contate o suporte.</p>
        <Link href="/dashboard" className="text-blue-500 mt-4 inline-block">
          Voltar ao dashboard
        </Link>
      </div>
    );
  }
}