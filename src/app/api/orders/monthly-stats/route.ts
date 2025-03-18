// [2025-03-14 20:50:14] @sebastianascimento - API de estatísticas mensais com suporte multi-tenant
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

    console.log(`[2025-03-14 20:50:14] @sebastianascimento - Buscando estatísticas mensais para empresa: ${companyId}`);
    
    // Definir intervalo de 12 meses
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11); // Últimos 12 meses
    
    // Buscar pedidos apenas da empresa do usuário
    // CORREÇÃO: Verificar se o campo do timestamp se chama 'createdAt' no seu modelo Prisma
    // Se não for 'createdAt', substitua pelo nome correto (como orderDate, created_at, etc.)
    
    // Primeiro, vamos verificar a estrutura do primeiro pedido para determinar qual campo de data usar
    const sampleOrder = await prisma.order.findFirst({
      where: {
        companyId
      }
    });
    
    console.log(`[2025-03-14 20:50:14] @sebastianascimento - Estrutura do pedido para depuração:`, 
      sampleOrder ? Object.keys(sampleOrder) : "Nenhum pedido encontrado");
    
    // SOLUÇÃO 1: Se o campo correto for diferente de createdAt
    // Substituir 'createdAt' pelo campo correto do seu modelo, como 'orderDate' ou outro
    const dateField = 'orderDate'; // AJUSTE AQUI com o nome correto do campo de data no seu modelo
    
    // Criamos uma condição dinâmica para o where
    const whereCondition: any = {
      companyId // MULTI-TENANT: Filtrar por empresa
    };
    
    // Adicionar filtro de data apenas se o campo existir no modelo
    if (sampleOrder && dateField in sampleOrder) {
      whereCondition[dateField] = {
        gte: startDate,
        lte: endDate
      };
    }
    
    const orders = await prisma.order.findMany({
      where: whereCondition,
      // Não usamos select para evitar o erro, buscamos o objeto completo
    });
    
    console.log(`[2025-03-14 20:50:14] @sebastianascimento - ${orders.length} pedidos encontrados para empresa ${companyId}`);
    
    // Agrupar os pedidos por mês
    const monthlyOrders = new Map();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Inicializar todos os meses dos últimos 12 meses com zero pedidos
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${date.getMonth()+1}`;
      const monthIndex = date.getMonth();
      
      monthlyOrders.set(monthKey, {
        name: monthNames[monthIndex],
        orders: 0
      });
    }
    
    // Contabilizar os pedidos por mês
    orders.forEach(order => {
      // Usar o campo de data correto do modelo
      const orderDate = order[dateField as keyof typeof order] || new Date();
      const date = new Date(orderDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth()+1}`;
      
      if (monthlyOrders.has(monthKey)) {
        const current = monthlyOrders.get(monthKey);
        monthlyOrders.set(monthKey, {
          ...current,
          orders: current.orders + 1
        });
      }
    });
    
    // Converter para array e ordenar cronologicamente
    const result = Array.from(monthlyOrders.values()).reverse();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("[2025-03-14 20:50:14] @sebastianascimento - Erro ao processar estatísticas mensais:", error);
    return NextResponse.json({ error: "Failed to fetch monthly stats" }, { status: 500 });
  }
}