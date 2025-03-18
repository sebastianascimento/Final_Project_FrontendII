// [2025-03-15 09:17:10] @sebastianascimento - API de estatísticas semanais com suporte multi-tenant
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

    console.log(`[2025-03-15 09:17:10] @sebastianascimento - Buscando estatísticas semanais para empresa: ${companyId}`);
    
    // Definir intervalo para a semana atual
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sábado
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Buscar pedidos da semana com filtro por empresa
    // USANDO O CAMPO 'date' QUE EXISTE NO SEU MODELO (não 'createdAt')
    const orders = await prisma.order.findMany({
      where: {
        companyId, // MULTI-TENANT: Filtrar por empresa
        date: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    });
    
    console.log(`[2025-03-15 09:17:10] @sebastianascimento - ${orders.length} pedidos encontrados para empresa ${companyId}`);
    
    // Agrupar os pedidos por dia da semana
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weeklyData = new Map();
    
    // Inicializar todos os dias da semana com zero pedidos
    for (let i = 0; i < 7; i++) {
      weeklyData.set(i, {
        name: dayNames[i],
        orders: 0
      });
    }
    
    // Contabilizar os pedidos por dia da semana
    orders.forEach(order => {
      const orderDate = order.date; // Usando o campo 'date' do seu modelo
      const dayOfWeek = orderDate.getDay(); // 0 = Domingo, 6 = Sábado
      
      const currentDay = weeklyData.get(dayOfWeek);
      weeklyData.set(dayOfWeek, {
        ...currentDay,
        orders: currentDay.orders + 1
      });
    });
    
    // Converter para array
    const result = Array.from(weeklyData.values());
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("[2025-03-15 09:17:10] @sebastianascimento - Erro ao processar estatísticas semanais:", error);
    
  }
}

// Função para gerar dados simulados em caso de erro
function generateSimulatedStats(companyId: string) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Gerar valor pseudo-aleatório baseado no ID da empresa para consistência
  const companyHash = companyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const result = dayNames.map((name, index) => {
    // Fórmula para gerar um número entre 3 e 25 baseado no companyId
    const seed = (companyHash + index) % 100 / 100;
    const orderCount = Math.floor(seed * 22) + 3;
    
    return {
      name,
      orders: orderCount
    };
  });
  
  return NextResponse.json(result);
}