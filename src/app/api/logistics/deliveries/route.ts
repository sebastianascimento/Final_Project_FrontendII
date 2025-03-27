import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/auth'

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const companyId = request.nextUrl.searchParams.get("companyId") || session.user.companyId;
    
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    
    const shippings = await prisma.shipping.findMany({
      where: {
        companyId, 
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
    
    
    const productIds = [...new Set(shippings.map(s => s.productId))];
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        companyId
      }
    });
    
    const productMap = new Map();
    products.forEach(product => {
      productMap.set(product.id, product);
    });
    
    const deliveries = shippings.map(shipping => {
      const product = productMap.get(shipping.productId);
      
      return {
        id: shipping.id,
        productName: product ? product.name : `Produto #${shipping.productId}`,
        customerName: "Cliente", 
        estimatedDelivery: shipping.estimatedDelivery?.toISOString() || new Date().toISOString(),
        shippingStatus: shipping.status || "PENDING",
        address: "Endereço de entrega", 
        orderNumber: `Entrega #${shipping.id}`,
        carrier: shipping.carrier || undefined,
        companyId: shipping.companyId
      };
    });
    
    return NextResponse.json(deliveries);
}