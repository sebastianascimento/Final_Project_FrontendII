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

    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    
    
    const sampleOrder = await prisma.order.findFirst({
      where: {
        companyId
      }
    });
    
    const dateField = 'orderDate'; 
    
    const whereCondition: any = {
      companyId 
    };
    
    if (sampleOrder && dateField in sampleOrder) {
      whereCondition[dateField] = {
        gte: startDate,
        lte: endDate
      };
    }
    
    const orders = await prisma.order.findMany({
      where: whereCondition,
    });
    
    
    const monthlyOrders = new Map();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
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
    
    orders.forEach(order => {
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
    
    const result = Array.from(monthlyOrders.values()).reverse();
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch monthly stats" }, { status: 500 });
  }
}