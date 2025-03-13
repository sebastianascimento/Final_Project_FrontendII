import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  // Informações atualizadas conforme fornecido
  const currentDate = "2025-03-12 12:45:26";
  const currentUser = "sebastianascimento";
  
  console.log(`Brand sales API called at: ${currentDate} by user: ${currentUser}`);

  try {
    // Primeiro, vamos tentar buscar todas as marcas para ter seus nomes reais
    let brandNames: Record<number, string> = {};
    try {
      const brands = await prisma.brand.findMany({
        select: {
          id: true,
          name: true,
        }
      });
      
      // Criar mapa de ID da marca para seu nome
      brands.forEach(brand => {
        brandNames[brand.id] = brand.name;
      });
      
      console.log(`Found ${brands.length} brand records in the database`);
    } catch (e) {
      console.log("Could not find brand table. Will use product names as fallback.");
    }
    
    // Buscar todos os produtos
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        brandId: true,
      }
    });
    
    // Buscar todos os pedidos
    const orders = await prisma.order.findMany({
      select: {
        productId: true,
        quantity: true,
      }
    });
    
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
        brandName = product.name;
      } else {
        // Sem brandId, usar o nome do produto
        brandName = product.name;
      }
      
      // Inicializar ou incrementar
      if (!brandSales[brandName]) {
        brandSales[brandName] = 0;
      }
      brandSales[brandName] += order.quantity || 0;
    });
    
    // Converter para array e ordenar
    const results = Object.entries(brandSales)
      .map(([name, totalSales]) => ({ 
        name, 
        totalSales 
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5); // Top 5
    
    console.log(`Successfully found ${results.length} brands with sales data`);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in brand sales API:", error);
    return NextResponse.json([], { status: 500 });
  }
}