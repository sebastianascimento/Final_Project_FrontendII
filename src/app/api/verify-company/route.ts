import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token?.email) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    
    if (!token.companyId) {
      return NextResponse.json({ error: "no-company" }, { status: 403 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: { companyId: true }
    });
    
    if (!user || !user.companyId) {
      return NextResponse.json({ error: "user-missing-company" }, { status: 403 });
    }
    
    if (user.companyId !== token.companyId) {
    }
    
    const company = await prisma.company.findUnique({
      where: { id: user.companyId }
    });
    
    if (!company) {
      return NextResponse.json({ error: "company-not-found" }, { status: 404 });
    }
    
    
    return NextResponse.json({
      status: "ok",
      companyId: company.id,
      companyName: company.name
    });
  } catch (error) {
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}