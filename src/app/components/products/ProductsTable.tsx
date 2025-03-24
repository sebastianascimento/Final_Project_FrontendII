// Componente sem "use client" - este é um Server Component
import Image from "next/image";
import ProductActions from "./ProdctsActions";

// Defina a interface para o produto
interface Product {
  id: string | number;
  name: string;
  price: number;
  description?: string | null;
  img?: string | null;
  categoryId?: number | null;
  brandId?: number | null;
  supplierId?: number | null;
  category?: { name: string } | null;
  brand?: { name: string } | null;
  supplier?: { name: string } | null;
}

// Defina o tipo para as props do componente
interface ProductsTableProps {
  products: Product[];
}

// Use a tipagem explícita no parâmetro
export default function ProductsTable({ products }: ProductsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Produto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Preço
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Categoria
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Marca
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Fornecedor
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center">
                <p className="text-gray-500">Nenhum produto encontrado</p>
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <Image
                        src={product.img || "/noAvatar.png"}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {product.description || "Sem descrição"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  R$ {Number(product.price).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  {product.category?.name || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  {product.brand?.name || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                  {product.supplier?.name || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <ProductActions product={product} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}