import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma"; // Ajuste o caminho conforme necessário
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      );
    }
    
    // Obter dados da requisição
    const { companyName } = await request.json();
    
    if (!companyName || typeof companyName !== "string") {
      return NextResponse.json(
        { message: "Nome da empresa é obrigatório" },
        { status: 400 }
      );
    }
    
    console.log(`[2025-03-14 11:57:03] @sebastianascimento - Configurando empresa: ${companyName}`);
    
    // Verificar se o usuário existe
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    // Se não existir, criar usuário
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
          image: session.user.image
        }
      });
      console.log(`[2025-03-14 11:57:03] @sebastianascimento - Criado novo usuário: ${user.email}`);
    }
    
    // Criar empresa
    const company = await prisma.company.create({
      data: { name: companyName }
    });
    
    // Associar empresa ao usuário
    await prisma.user.update({
      where: { id: user.id },
      data: { companyId: company.id }
    });
    
    console.log(`[2025-03-14 11:57:03] @sebastianascimento - Empresa criada: ${company.name} (${company.id})`);
    
    // Retornar dados da empresa
    return NextResponse.json({
      message: "Empresa configurada com sucesso",
      companyId: company.id,
      companyName: company.name
    });
  } catch (error) {
    console.error("[2025-03-14 11:57:03] Erro ao configurar empresa:", error);
    
    return NextResponse.json(
      { message: "Erro ao configurar empresa" },
      { status: 500 }
    );
  }
}