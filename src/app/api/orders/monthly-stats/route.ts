import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  // Informações atualizadas conforme solicitado
  const currentDate = "2025-03-12 11:51:28";
  const currentUser = "sebastianascimento";
  
  console.log(`Monthly stats API called at: ${currentDate} by user: ${currentUser}`);

  try {
    // Buscar todos os pedidos
    const orders = await prisma.order.findMany({
      select: {
        date: true,
      },
    });

    // Se não houver pedidos, retornar array vazio
    if (orders.length === 0) {
      return NextResponse.json([]);
    }

    // Nomes dos meses para visualização
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Agrupar pedidos por mês
    const ordersByMonth: Record<string, number> = {};
    
    // Processar cada pedido
    orders.forEach((order) => {
      const orderDate = new Date(order.date);
      const month = orderDate.getMonth(); // 0-11
      const year = orderDate.getFullYear();
      const monthKey = `${monthNames[month]} ${year}`; // Ex: "Jan 2025"
      
      // Inicializar ou incrementar contagem para este mês
      if (!ordersByMonth[monthKey]) {
        ordersByMonth[monthKey] = 1;
      } else {
        ordersByMonth[monthKey] += 1;
      }
    });
    
    // Converter objeto para array no formato necessário para o gráfico
    const processedData = Object.entries(ordersByMonth).map(([name, orders]) => ({
      name,
      orders
    }));
    
    // Ordenar os meses cronologicamente
    processedData.sort((a, b) => {
      // Separar mês e ano
      const [monthA, yearA] = a.name.split(' ');
      const [monthB, yearB] = b.name.split(' ');
      
      // Comparar anos primeiro
      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB);
      }
      
      // Se os anos forem iguais, comparar meses
      const monthIndexA = monthNames.indexOf(monthA);
      const monthIndexB = monthNames.indexOf(monthB);
      return monthIndexA - monthIndexB;
    });
    
    return NextResponse.json(processedData);
  } catch (error) {
    console.error("Error fetching monthly order stats:", error);
    return NextResponse.json([], { status: 500 });
  }
}