import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/auth'

export const revalidate = 10;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const orderBy = searchParams.get("orderBy") || "name";
    const order = searchParams.get("order") || "asc";
    
    const skip = Math.max(0, (page - 1) * limit);
    const take = Math.min(100, limit);

    const startTime = performance.now();

    const session = await getServerSession(authOptions);
    const companyId = session?.user?.companyId;
    
    const where: any = {};
    
    if (companyId) {
      where.companyId = companyId;
    } else {
      where.isPublic = true; 
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const cacheControl = request.headers.get("cache-control");
    
    const orderByObject: any = {};
    orderByObject[orderBy] = order.toLowerCase();

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          price: true,
        },
        orderBy: orderByObject,
        skip,
        take,
      }),
      prisma.product.count({ where })
    ]);
    
    const duration = performance.now() - startTime;

    return NextResponse.json({
      data: products,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / take)
      },
      meta: {
        executionTimeMs: Math.round(duration)
      }
    }, {
      headers: {
        'Cache-Control': cacheControl || 'public, s-maxage=10, stale-while-revalidate=59'
      }
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: "Failed to fetch products", 
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}