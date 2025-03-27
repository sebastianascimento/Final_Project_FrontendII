import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/auth'
import { prisma } from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }
    
    
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        company: true 
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      companyId: user.companyId,
      companyName: user.company?.name || null,
      companyRole: user.role || null
    };
    
    
    return NextResponse.json(userProfile);
  } catch (error) {
    
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}