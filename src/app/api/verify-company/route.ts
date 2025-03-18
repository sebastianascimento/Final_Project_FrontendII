// [2025-03-14 12:45:31] @sebastianascimento - API corrigida para verificar empresa
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // Obter token JWT
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // Se não está autenticado
    if (!token?.email) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    
    if (!token.companyId) {
      return NextResponse.json({ error: "no-company" }, { status: 403 });
    }
    
    // Verificar se o usuário existe com esta empresa associada
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: { companyId: true }
    });
    
    // Se o usuário não existe ou não tem companyId no banco
    if (!user || !user.companyId) {
      return NextResponse.json({ error: "user-missing-company" }, { status: 403 });
    }
    
    // Se o companyId do token não corresponde ao companyId do banco
    if (user.companyId !== token.companyId) {
      console.log(`[2025-03-14 12:45:31] @sebastianascimento - Diferença entre companyId do token (${token.companyId}) e do banco (${user.companyId})`);
    }
    
    // Verificar se a empresa existe
    const company = await prisma.company.findUnique({
      where: { id: user.companyId }
    });
    
    if (!company) {
      return NextResponse.json({ error: "company-not-found" }, { status: 404 });
    }
    
    // Removida a verificação de isActive que estava causando o erro
    // já que este campo não existe no seu modelo Company
    
    // Tudo OK, empresa validada
    return NextResponse.json({
      status: "ok",
      companyId: company.id,
      companyName: company.name
    });
  } catch (error) {
    console.error(`[2025-03-14 12:45:31] @sebastianascimento - Erro ao verificar empresa:`, error);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}