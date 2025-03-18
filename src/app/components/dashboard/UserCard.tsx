import Image from "next/image";
import { countByCompany } from "@/app/lib/multiTenant";

// Tipo atualizado para incluir as versões no plural que já estão sendo usadas
type CardType = "customers" | "products" | "orders";

const UserCard = async ({
  type,
}: {
  type: CardType;
}) => {
  let count = 0;
  try {
    // Agora funciona com os tipos no plural
    count = await countByCompany(type);
    console.log(`[2025-03-14 14:22:06] @sebastianascimento - Contagem de ${type}: ${count}`);
  } catch (error) {
    console.error(`[2025-03-14 14:22:06] @sebastianascimento - Erro ao contar ${type}:`, error);
  }

  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          2025
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4">{count}</h1>
      <h2 className="capitalize text-sm font-medium text-gray-500">{type}</h2>
    </div>
  );
};

export default UserCard;