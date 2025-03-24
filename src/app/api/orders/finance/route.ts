// [2025-03-15 10:14:29] @sebastianascimento - API de dados financeiros com suporte multi-tenant
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface OrderWithProduct {
  id: number;
  date: Date | null;
  status: string | null;
  product: {
    price: number | null;
  } | null;
  quantity: number | null;
}

interface FormattedOrder {
  id: number;
  date: string | null;
  status: string | null;
  total: number;
}

export async function GET(request: NextRequest) {
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userCompanyId = request.nextUrl.searchParams.get("companyId") || session.user.companyId;
    
    if (!userCompanyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }
    

    const orders = await prisma.order.findMany({
      where: {
        companyId: userCompanyId
      },
      select: {
        id: true,
        date: true,
        status: true,
        product: {
          select: {
            price: true,
          }
        },
        quantity: true,
      }
    });

    const formattedOrders: FormattedOrder[] = orders.map((order: OrderWithProduct) => {
      return {
        id: order.id,
        date: order.date ? order.date.toISOString() : null,
        status: order.status,
        total: order.product?.price ? order.product.price * (order.quantity || 1) : 0,
      };
    });

    const validOrders = formattedOrders.filter((order: FormattedOrder) => order.date !== null);

    
    return NextResponse.json(validOrders);
  } catch (error) {
    
    return NextResponse.json({ 
      error: "Failed to fetch order data", 
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}