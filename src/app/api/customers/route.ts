import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/auth'


export async function GET(request: Request) {
  try {

    
    const { searchParams } = new URL(request.url);
    let companyId = searchParams.get('companyId');
    
    if (!companyId) {
      const session = await getServerSession(authOptions);
      companyId = session?.user?.companyId || null;
      
    } else {
    }
    
    const filter = companyId ? { companyId: String(companyId) } : {};

    const customers = await prisma.customer.findMany({
      where: filter,
      select: {
        id: true,
        name: true,
        companyId: true, 
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}