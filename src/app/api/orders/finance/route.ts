// [2025-03-15 10:14:29] @sebastianascimento - API de dados financeiros com suporte multi-tenant
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

export async function GET(request: NextRequest) {
  const currentDate = "2025-03-15 10:14:29";
  const currentUser = "sebastianascimento";
  
  try {
    // MULTI-TENANT: Verificação de autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log(`[${currentDate}] @${currentUser} - Tentativa de acesso não autorizado à API Finance`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // MULTI-TENANT: Obter o companyId da URL ou da sessão
    const userCompanyId = request.nextUrl.searchParams.get("companyId") || session.user.companyId;
    
    if (!userCompanyId) {
      console.log(`[${currentDate}] @${currentUser} - Requisição sem ID da empresa para API Finance`);
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }
    
    console.log(`[${currentDate}] @${currentUser} - API Finance chamada para empresa: ${userCompanyId}`);

    // MULTI-TENANT: Adicionar filtro de companyId
    const orders = await prisma.order.findMany({
      where: {
        companyId: userCompanyId // Filtrar apenas ordens da empresa do usuário
      },
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

    console.log(`[${currentDate}] @${currentUser} - Retornando ${validOrders.length} ordens válidas para empresa ${userCompanyId}`);
    
    return NextResponse.json(validOrders);
  } catch (error) {
    console.error(`[${currentDate}] @${currentUser} - Erro ao buscar ordens:`, error);
    
    return NextResponse.json({ 
      error: "Failed to fetch order data", 
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}