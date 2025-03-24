import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const timestamp = "2025-03-21 19:40:33";
    const username = "sebastianascimento";
    
    // Parse request body
    const data = await request.json();
    console.log(`[${timestamp}] @${username} - Creating supplier (alternate endpoint) with data:`, data);
    
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
    
    console.log(`[${timestamp}] @${username} - Created supplier (alternate endpoint): ${supplier.id}`);
    
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}