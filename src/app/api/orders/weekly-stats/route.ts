import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

// Definir um tipo para os nomes dos dias para resolver o erro de TypeScript
type DayName = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export async function GET() {
  // Informações atualizadas conforme solicitado
  const currentDate = "2025-03-12 11:10:47";
  const currentUser = "sebastianascimento";
  
  console.log(`API called at: ${currentDate} by user: ${currentUser}`);

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

    // Agrupar pedidos por dia - apenas contando o total
    const ordersByDay = new Map<DayName, { name: DayName; orders: number }>();
    
    // Definir dias da semana com typagem correta
    const daysOfWeek: DayName[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Processar cada pedido individualmente
    orders.forEach((order) => {
      const orderDate = new Date(order.date);
      const dayIndex = orderDate.getDay(); // 0-6
      const dayName = daysOfWeek[dayIndex];
      
      // Inicializar ou incrementar contagem para este dia
      if (!ordersByDay.has(dayName)) {
        ordersByDay.set(dayName, {
          name: dayName,
          orders: 1
        });
      } else {
        const dayData = ordersByDay.get(dayName);
        if (dayData) {
          dayData.orders += 1;
        }
      }
    });
    
    // Converter o mapa para array
    const processedData = Array.from(ordersByDay.values());
    
    // Ordenar os dias da semana corretamente (Segunda a Domingo)
    // Corrigindo o erro TypeScript com a definição explícita de tipos
    const dayOrder: Record<DayName, number> = { 
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 
    };
    
    processedData.sort((a, b) => {
      // Garantindo a typagem correta dos índices
      return dayOrder[a.name as DayName] - dayOrder[b.name as DayName];
    });
    
    return NextResponse.json(processedData);
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return NextResponse.json([], { status: 500 });
  }
}