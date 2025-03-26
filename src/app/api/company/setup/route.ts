import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma"; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }
    
    const { companyName } = await request.json();
    
    if (!companyName || typeof companyName !== "string") {
      return NextResponse.json(
        { message: "Nome da empresa é obrigatório" },
        { status: 400 }
      );
    }
    
    
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
          image: session.user.image
        }
      });
    }
    
    const company = await prisma.company.create({
      data: { name: companyName }
    });
    
    await prisma.user.update({
      where: { id: user.id },
      data: { companyId: company.id }
    });
    
    
    return NextResponse.json({
      message: "Empresa configurada com sucesso",
      companyId: company.id,
      companyName: company.name
    });
}