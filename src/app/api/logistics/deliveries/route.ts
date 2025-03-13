import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

// Interface para o shipping com seus campos
interface ShippingModel {
  id: number;
  name: string;
  status: string;
  carrier: string;
  estimatedDelivery: Date | null;
  stockId: number;
  productId: number;
  product?: {
    name: string;
  } | null;
}

// Interface para os eventos de entrega
interface DeliveryEvent {
  id: number;
  productName: string;
  customerName: string;
  estimatedDelivery: Date | null;
  shippingStatus: string;
  address: string;
  orderNumber: string;
  carrier?: string;
  quantity?: number;
}

export async function GET() {
  const currentDate = "2025-03-13 09:56:04";
  const currentUser = "sebastianascimento";
  
  console.log(`Logistics deliveries API called at: ${currentDate} by user: ${currentUser}`);

  try {
    // Buscar todos os shippings sem filtro em estimatedDelivery
    const shippings = await prisma.shipping.findMany({
      include: {
        product: true,
      }
    });
    
    // Filtrar em JavaScript os que têm data de estimativa não nula
    const validShippings = shippings.filter((ship: ShippingModel) => ship.estimatedDelivery !== null);

    console.log(`Found ${validShippings.length} shipments with delivery dates`);

    if (validShippings.length === 0) {
      // Retornando array vazio se não houver entregas com data
      return NextResponse.json([], { status: 200 });
    }

    // Transformar os dados do banco em eventos para o calendário
    const events: DeliveryEvent[] = validShippings.map((shipping: ShippingModel) => {
      return {
        id: shipping.id,
        productName: shipping.product?.name || shipping.name || "Produto não especificado",
        customerName: "Cliente", // Não temos acesso direto ao cliente pelo modelo Shipping
        estimatedDelivery: shipping.estimatedDelivery, // Usando o campo correto
        shippingStatus: shipping.status || "pending",
        address: "Endereço de entrega", // Não temos acesso direto ao endereço pelo modelo Shipping
        orderNumber: `SHP-${shipping.id.toString().padStart(6, '0')}`,
        carrier: shipping.carrier || undefined,
        quantity: 1 // Shipping não tem quantidade no modelo
      };
    });

    // Serializar as datas para JSON
    const serializableData = events.map((event: DeliveryEvent) => ({
      ...event,
      estimatedDelivery: event.estimatedDelivery?.toISOString() || null
    }));

    return NextResponse.json(serializableData);
  } catch (error) {
    // Registro detalhado do erro para ajudar na depuração
    console.error("Error fetching shipping data:", error);
    
    // Retornar uma resposta mais informativa
    return NextResponse.json({ 
      error: "Failed to fetch shipping data", 
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}