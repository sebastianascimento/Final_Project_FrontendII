import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Menu from "../../components/dashboard/Menu";
import Navbar from "../../components/dashboard/Navbar";
import TableSearch from "../../components/products/TableSearch";
import Pagination from "@/app/components/products/Pagination";
import Image from "next/image";
import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";
import { ITEM_PER_PAGE } from "@/app/lib/setting";
import FormModal from "../../components/FormModal";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Produtos | BizControl - Sistema de Gestão de Produtos',
  description: 'Gerencie o catálogo de produtos da sua empresa. Adicione, edite e exclua produtos facilmente.',
  keywords: ['gerenciamento de produtos', 'catálogo de produtos', 'inventário', 'estoque', 'preços'],
  openGraph: {
    title: 'Gerenciamento de Produtos - BizControl',
    description: 'Sistema completo para gestão do catálogo de produtos da sua empresa',
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

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

interface ProductOffer {
  "@type": string;
  price: string;
  priceCurrency: string;
}

interface ProductItem {
  "@type": string;
  name: string;
  description: string;
  offers: ProductOffer;
}

interface ListItem {
  "@type": string;
  position: number;
  item: ProductItem;
}

interface ProductListData {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  numberOfItems: number;
  itemListOrder: string;
  itemListElement: ListItem[];
}

async function getSearchParams(params: any) {
  return params;
}

async function getProductsData(
  companyId: string,
  pageParam: string,
  searchParam: string
) {
  const page = Number(pageParam) || 1;
  const currentPage = Math.max(1, page);
  const searchTerm = searchParam || "";
  const take = ITEM_PER_PAGE;
  const skip = ITEM_PER_PAGE * (currentPage - 1);

  let where: Prisma.ProductWhereInput = { companyId };

  if (searchTerm) {
    where = {
      AND: [
        { companyId },
        {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              description: {
                contains: searchTerm,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        },
      ],
    };
  }

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { name: "asc" },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    totalCount,
    currentPage,
    searchTerm
  };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  if (!session.user.companyId) {
    redirect("/setup-company");
  }

  const companyId = session.user.companyId;
  const awaitedParams = await getSearchParams(searchParams);
  const pageValue = awaitedParams.page || "1";
  const searchValue = awaitedParams.search || "";
  
  const jsonLdData: ProductListData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Catálogo de Produtos",
    "description": "Lista de produtos disponíveis em nosso sistema",
    "numberOfItems": 0,
    "itemListOrder": "Ascending",
    "itemListElement": []
  };
  
  try {
    const { 
      products, 
      totalCount, 
      currentPage,
      searchTerm 
    } = await getProductsData(
      companyId,
      pageValue,
      searchValue
    );

    jsonLdData.numberOfItems = totalCount;
    
    const itemListElements: ListItem[] = products.map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.name,
        "description": product.description || "Sem descrição",
        "offers": {
          "@type": "Offer",
          "price": product.price.toString(),
          "priceCurrency": "USD"
        }
      }
    }));
    
    jsonLdData.itemListElement = itemListElements;

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
                  All Products
                </h1>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <TableSearch initialValue={searchTerm} />
                  <div className="flex items-center gap-3 sm:gap-4 self-center sm:self-end">
                    <FormModal table="product" type="create" />
                  </div>
                </div>
              </div>

              {/* Mobile view for products - card style layout */}
              <div className="mt-4 block sm:hidden">
                {products.length === 0 ? (
                  <div className="text-center p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-500">
                      Nenhum produto encontrado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div key={product.id} className="bg-gray-50 p-3 rounded-md">
                        <div className="mb-2">
                          <div className="font-semibold text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {product.description || "Sem descrição"}
                          </div>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><span className="text-gray-500">Price:</span> ${Number(product.price).toFixed(2)}</p>
                          {product.category?.name && (
                            <p><span className="text-gray-500">Category:</span> {product.category.name}</p>
                          )}
                          {product.brand?.name && (
                            <p><span className="text-gray-500">Brand:</span> {product.brand.name}</p>
                          )}
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <FormModal
                            table="product"
                            type="update"
                            data={product}
                            id={product.id}
                          />
                          <FormModal
                            table="product"
                            type="delete"
                            id={product.id}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop view for products - table layout */}
              <div className="mt-6 overflow-x-auto hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200" aria-label="Lista de Produtos">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Supplier
                      </th>
                      <th scope="col" className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center">
                          <p className="text-gray-500">
                            Nenhum produto encontrado
                          </p>
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr
                          key={product.id}
                          className="border-b border-gray-200 even:bg-gray-50 text-sm hover:bg-lamaPurpleLight"
                        >
                          <td className="p-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-[300px]">
                                {product.description || "Sem descrição"}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            $ {Number(product.price).toFixed(2)}
                          </td>
                          <td className="p-4">
                            {product.category?.name || "N/A"}
                          </td>
                          <td className="p-4">
                            {product.brand?.name || "N/A"}
                          </td>
                          <td className="p-4 hidden lg:table-cell">
                            {product.supplier?.name || "N/A"}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <FormModal
                                table="product"
                                type="update"
                                data={product}
                                id={product.id}
                              />
                              <FormModal
                                table="product"
                                type="delete"
                                id={product.id}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination page={currentPage} count={totalCount} />
              
            </section>
          </main>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error loading products:", error);
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 bg-gray-50" role="alert" aria-live="assertive">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg w-full">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Erro ao carregar produtos
          </h1>
          <p className="text-gray-600">
            Ocorreu um problema ao carregar os produtos. Por favor, tente
            novamente mais tarde.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }
}