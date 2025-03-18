// [2025-03-14 21:03:55] @sebastianascimento - API de Entregas com Multi-tenant corrigida
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    // Verificação de autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // MULTI-TENANT: Obter o companyId da URL ou da sessão
    const companyId = request.nextUrl.searchParams.get("companyId") || session.user.companyId;
    
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    console.log(`[2025-03-14 21:03:55] @sebastianascimento - Buscando entregas para empresa: ${companyId}`);
    
    // Buscar entregas (shippings) com filtro por empresa
    const shippings = await prisma.shipping.findMany({
      where: {
        companyId, // MULTI-TENANT: Filtrar por empresa
        // Apenas entregas com data estimada definida
        estimatedDelivery: {
          not: undefined 
        }
      },
      select: {
        id: true,
        name: true,
        status: true,
        carrier: true,
        estimatedDelivery: true,
        companyId: true,
        productId: true,
        stockId: true
      },
      orderBy: {
        estimatedDelivery: 'asc'
      }
    });
    
    console.log(`[2025-03-14 21:03:55] @sebastianascimento - ${shippings.length} entregas encontradas para empresa ${companyId}`);
    
    // Buscar produtos em massa para melhorar a performance
    const productIds = [...new Set(shippings.map(s => s.productId))];
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        companyId
      }
    });
    
    // Criar um mapa para acessar os produtos rapidamente
    const productMap = new Map();
    products.forEach(product => {
      productMap.set(product.id, product);
    });
    
    // Transformar os dados sem depender de relacionamentos complexos
    const deliveries = shippings.map(shipping => {
      // Buscar o produto do mapa
      const product = productMap.get(shipping.productId);
      
      return {
        id: shipping.id,
        productName: product ? product.name : `Produto #${shipping.productId}`,
        customerName: "Cliente", // Valor padrão já que não temos a relação direta
        estimatedDelivery: shipping.estimatedDelivery?.toISOString() || new Date().toISOString(),
        shippingStatus: shipping.status || "PENDING",
        address: "Endereço de entrega", // Valor padrão, ajustar conforme necessário
        orderNumber: `Entrega #${shipping.id}`,
        carrier: shipping.carrier || undefined,
        companyId: shipping.companyId
      };
    });
    
    return NextResponse.json(deliveries);
  } catch (error) {
    console.error("[2025-03-14 21:03:55] @sebastianascimento - Erro ao buscar entregas:", error);
    return NextResponse.json({ error: "Failed to fetch deliveries" }, { status: 500 });
  }
}