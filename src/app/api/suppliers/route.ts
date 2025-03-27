import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/auth'

// Get all suppliers
export async function GET() {
  try {
    const timestamp = "2025-03-21 19:40:33";
    const username = "sebastianascimento";
    
    // Get current user's company ID
    const session = await getServerSession(authOptions);
    const companyId = session?.user?.companyId;
    
    console.log(`[${timestamp}] @${username} - Fetching suppliers, companyId: ${companyId || 'none'}`);
    
    // Filter by company ID if available
    const whereClause = companyId ? { companyId } : {};
    
    const suppliers = await prisma.supplier.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        contactInfo: true,
        companyId: true
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    console.log(`[${timestamp}] @${username} - Found ${suppliers.length} suppliers`);
    
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

// Create a new supplier
export async function POST(request: Request) {
  try {
    const timestamp = "2025-03-21 19:40:33";
    const username = "sebastianascimento";
    
    // Parse request body
    const data = await request.json();
    console.log(`[${timestamp}] @${username} - Creating supplier with data:`, data);
    
    if (!data.name) {
      return NextResponse.json(
        { error: "Supplier name is required" },
        { status: 400 }
      );
    }
    
    // Get user's company ID
    const session = await getServerSession(authOptions);
    const companyId = session?.user?.companyId;
    
    // Prepare supplier data
    const supplierData: any = {
      name: data.name,
      contactInfo: data.contactInfo || `Contact info for ${data.name}`
    };
    
    // Add company relation if company ID exists
    if (companyId) {
      supplierData.company = {
        connect: { id: companyId }
      };
    }
    
    // Create the supplier
    const supplier = await prisma.supplier.create({
      data: supplierData
    });
    
    console.log(`[${timestamp}] @${username} - Created supplier: ${supplier.id}`);
    
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}