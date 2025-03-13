import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

// Interface para o modelo de ordem do banco de dados
interface OrderWithProduct {
  id: number;
  date: Date | null;
  status: string | null;
  product: {
    price: number | null;
  } | null;
  quantity: number | null;
}

// Interface para os dados formatados retornados pela API
interface FormattedOrder {
  id: number;
  date: string | null;
  status: string | null;
  total: number;
}

export async function GET() {
  const currentDate = "2025-03-13 10:25:00";
  const currentUser = "sebastianascimento";
  
  console.log(`Orders finance API called at: ${currentDate} by user: ${currentUser}`);

  try {
    // Buscar todas as ordens do banco de dados
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        date: true,
        status: true,
        // Calculando o total da ordem
        product: {
          select: {
            price: true,
          }
        },
        quantity: true,
      }
    });

    // Transformar os dados para o formato necessário
    const formattedOrders: FormattedOrder[] = orders.map((order: OrderWithProduct) => {
      return {
        id: order.id,
        date: order.date ? order.date.toISOString() : null,
        status: order.status,
        // Cálculo do total: preço unitário * quantidade
        total: order.product?.price ? order.product.price * (order.quantity || 1) : 0,
      };
    });

    // Filtrar ordens sem data
    const validOrders = formattedOrders.filter((order: FormattedOrder) => order.date !== null);

    return NextResponse.json(validOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    
    return NextResponse.json({ 
      error: "Failed to fetch order data", 
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}