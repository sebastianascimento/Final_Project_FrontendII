import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
    

    let brandNames: Record<number, string> = {};
    try {
      const brands = await prisma.brand.findMany({
        select: {
          id: true,
          name: true,
        },
        where: {
          ...(prisma.brand.fields.companyId ? { companyId: userCompanyId } : {})
        }
      });
      
      brands.forEach(brand => {
        brandNames[brand.id] = brand.name;
      });
      
    } catch (e) {
   }
    
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        brandId: true,
      },
      where: {
        companyId: userCompanyId
      }
    });
    
    if (products.length === 0) {
      return NextResponse.json([]);
    }
    
    const orders = await prisma.order.findMany({
      select: {
        productId: true,
        quantity: true,
      },
      where: {
        companyId: userCompanyId
      }
    });
    
    if (orders.length === 0) {
      return NextResponse.json([]);
    }
    
    const productMap: Record<number, { name: string, brandId: number | null }> = {};
    products.forEach(product => {
      productMap[product.id] = {
        name: product.name,
        brandId: product.brandId
      };
    });
    
    const brandSales: Record<string, number> = {};
    
    orders.forEach(order => {
      if (!order.productId || !productMap[order.productId]) return;
      
      const product = productMap[order.productId];
      const brandId = product.brandId;
      
      let brandName: string;
      
      if (brandId && brandNames[brandId]) {
        brandName = brandNames[brandId];
      } else if (brandId) {
        brandName = `Brand #${brandId}`;
      } else {
        brandName = product.name;
      }
      
      if (!brandSales[brandName]) {
        brandSales[brandName] = 0;
      }
      brandSales[brandName] += order.quantity || 1; 
    });
    
    const results = Object.entries(brandSales)
      .map(([name, totalSales]) => ({ 
        name, 
        totalSales 
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5); 
    
    return NextResponse.json(results);
  } catch (error) {
    
    return NextResponse.json(
      { 
        error: "Failed to process brand sales data",
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}