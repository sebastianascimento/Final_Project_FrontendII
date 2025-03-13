"use client";

import FormModal from "@/app/components/FormModal";

interface CustomerData {
  id: number;
  name: string;
  email: string;
  address: string;
  picture?: string | null;
  _count?: {
    orders: number;
  };
}

const CustomerRow = ({ item }: { item: CustomerData }) => {
  return (
    <tr className="border-b border-gray-200 even:bg-gray-50 text-sm hover:bg-lamaPurpleLight">
      <td className="p-4">#{item.id}</td>
      <td className="flex items-center gap-2">
        {item.picture ? (
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img 
              src={item.picture} 
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/32?text=User";
              }}
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium">
            {item.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-medium">{item.name}</span>
      </td>
      <td className="hidden md:table-cell">{item.email}</td>
      <td className="hidden md:table-cell">
        <span className="truncate max-w-[200px] block">{item.address}</span>
      </td>
      <td className="hidden md:table-cell">
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          {item._count?.orders || 0}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <FormModal 
            table="customer" 
            type="update" 
            data={item} 
            id={item.id} 
          />
          <FormModal 
            table="customer" 
            type="delete" 
            id={item.id} 
          />
        </div>
      </td>
    </tr>
  );
};

export default CustomerRow;