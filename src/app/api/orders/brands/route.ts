// [2025-03-15 09:51:16] @sebastianascimento - API de vendas por marca com suporte multi-tenant
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  // Informações atualizadas conforme fornecido
  const currentDate = "2025-03-15 09:51:16";
  const currentUser = "sebastianascimento";
  
  try {
    // MULTI-TENANT: Verificação de autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log(`[${currentDate}] @${currentUser} - Unauthorized access attempt to brand sales API`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // MULTI-TENANT: Obter o companyId da URL ou da sessão
    const userCompanyId = request.nextUrl.searchParams.get("companyId") || session.user.companyId;
    
    if (!userCompanyId) {
      console.log(`[${currentDate}] @${currentUser} - Missing company ID in brand sales request`);
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }
    
    console.log(`[${currentDate}] @${currentUser} - Brand sales API called for company: ${userCompanyId}`);

    // Primeiro, vamos tentar buscar todas as marcas para ter seus nomes reais
    let brandNames: Record<number, string> = {};
    try {
      const brands = await prisma.brand.findMany({
        select: {
          id: true,
          name: true,
        },
        // MULTI-TENANT: Filtrar marcas por companyId se existir esse campo
        where: {
          ...(prisma.brand.fields.companyId ? { companyId: userCompanyId } : {})
        }
      });
      
      // Criar mapa de ID da marca para seu nome
      brands.forEach(brand => {
        brandNames[brand.id] = brand.name;
      });
      
      console.log(`[${currentDate}] @${currentUser} - Found ${brands.length} brand records for company ${userCompanyId}`);
    } catch (e) {
      console.log(`[${currentDate}] @${currentUser} - Could not find brand table. Will use product names as fallback.`);
    }
    
    // Buscar todos os produtos
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        brandId: true,
      },
      // MULTI-TENANT: Filtrar produtos por companyId
      where: {
        companyId: userCompanyId
      }
    });
    
    // MULTI-TENANT: Se não houver produtos para esta empresa, retornar array vazio
    if (products.length === 0) {
      console.log(`[${currentDate}] @${currentUser} - No products found for company ${userCompanyId}`);
      return NextResponse.json([]);
    }
    
    // Buscar todos os pedidos DESTA EMPRESA
    const orders = await prisma.order.findMany({
      select: {
        productId: true,
        quantity: true,
      },
      // MULTI-TENANT: Filtrar pedidos por companyId
      where: {
        companyId: userCompanyId
      }
    });
    
    // MULTI-TENANT: Se não houver pedidos para esta empresa, retornar array vazio
    if (orders.length === 0) {
      console.log(`[${currentDate}] @${currentUser} - No orders found for company ${userCompanyId}`);
      return NextResponse.json([]);
    }
    
    // Criar mapa de produtos
    const productMap: Record<number, { name: string, brandId: number | null }> = {};
    products.forEach(product => {
      productMap[product.id] = {
        name: product.name,
        brandId: product.brandId
      };
    });
    
    // Mapa para agrupar vendas por marca
    const brandSales: Record<string, number> = {};
    
    // Processar cada pedido
    orders.forEach(order => {
      if (!order.productId || !productMap[order.productId]) return;
      
      const product = productMap[order.productId];
      const brandId = product.brandId;
      
      // Determinar o nome da marca
      let brandName: string;
      
      if (brandId && brandNames[brandId]) {
        // Usar o nome real da marca se disponível
        brandName = brandNames[brandId];
      } else if (brandId) {
        // Se tiver brandId mas não tiver o nome, usar o nome do produto
        brandName = `Brand #${brandId}`;
      } else {
        // Sem brandId, usar o nome do produto
        brandName = product.name;
      }
      
      // Inicializar ou incrementar
      if (!brandSales[brandName]) {
        brandSales[brandName] = 0;
      }
      brandSales[brandName] += order.quantity || 1; // Garantir que quantidade seja ao menos 1
    });
    
    // Converter para array e ordenar
    const results = Object.entries(brandSales)
      .map(([name, totalSales]) => ({ 
        name, 
        totalSales 
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5); // Top 5
    
    console.log(`[${currentDate}] @${currentUser} - Successfully found ${results.length} brands with sales data for company ${userCompanyId}`);
    return NextResponse.json(results);
  } catch (error) {
    console.error(`[${currentDate}] @${currentUser} - Error in brand sales API:`, error);
    
    // Enviar resposta de erro mais informativa
    return NextResponse.json(
      { 
        error: "Failed to process brand sales data",
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}