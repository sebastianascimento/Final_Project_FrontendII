import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const companyId = request.nextUrl.searchParams.get("companyId") || session.user.companyId;
    
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); 
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); 
    endOfWeek.setHours(23, 59, 59, 999);
    
    const orders = await prisma.order.findMany({
      where: {
        companyId, 
        date: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    });
    
    
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weeklyData = new Map();
    
    for (let i = 0; i < 7; i++) {
      weeklyData.set(i, {
        name: dayNames[i],
        orders: 0
      });
    }
    
    orders.forEach(order => {
      const orderDate = order.date; 
      const dayOfWeek = orderDate.getDay(); 
      
      const currentDay = weeklyData.get(dayOfWeek);
      weeklyData.set(dayOfWeek, {
        ...currentDay,
        orders: currentDay.orders + 1
      });
    });
    
    const result = Array.from(weeklyData.values());
    
    return NextResponse.json(result);
  } catch (error) {
    
  }
}

function generateSimulatedStats(companyId: string) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const companyHash = companyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const result = dayNames.map((name, index) => {
    const seed = (companyHash + index) % 100 / 100;
    const orderCount = Math.floor(seed * 22) + 3;
    
    return {
      name,
      orders: orderCount
    };
  });
  
  return NextResponse.json(result);
}