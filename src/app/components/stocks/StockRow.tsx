"use client";

import FormModal from "@/app/components/FormModal";

interface StockItem {
  id: number;
  stockLevel: number;
  productId: number;
  supplierId: number;
  product: {
    id: number;
    name: string;
    price?: number | null;
  };
  supplier: {
    id: number;
    name: string;
  };
  _count?: {
    shippings: number;
  };
}

const StockRow = ({ item }: { item: StockItem }) => {
  // Função para obter a classe de cor baseada no nível de estoque
  const getStockLevelClass = (level: number) => {
    if (level <= 0) {
      return 'bg-red-100 text-red-800'; // Esgotado
    } else if (level < 10) {
      return 'bg-yellow-100 text-yellow-800'; // Baixo
    } else {
      return 'bg-green-100 text-green-800'; // Bom
    }
  };
  
  // Determinar o status do estoque
  const getStockStatus = (level: number) => {
    if (level <= 0) return 'Out of Stock';
    if (level < 10) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <tr className="border-b border-gray-200 even:bg-gray-50 text-sm hover:bg-gray-100">
      <td className="p-4">#{item.id}</td>
      <td>
        <div className="flex flex-col">
          <span className="font-medium">{item.product.name}</span>
          {item.product.price && (
            <span className="text-xs text-gray-500">Price: ${item.product.price.toFixed(2)}</span>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStockLevelClass(item.stockLevel)}`}>
            {getStockStatus(item.stockLevel)}
          </span>
          <span className="font-bold">{item.stockLevel}</span>
          <span className="text-xs text-gray-500">units</span>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <div className="flex flex-col">
          <span>{item.supplier.name}</span>
          <span className="text-xs text-gray-500">ID: {item.supplierId}</span>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          {item._count?.shippings || 0}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <FormModal 
            table="stock" 
            type="update" 
            data={item} 
            id={item.id} 
          />
          <FormModal 
            table="stock" 
            type="delete" 
            id={item.id} 
          />
        </div>
      </td>
    </tr>
  );
};

export default StockRow;