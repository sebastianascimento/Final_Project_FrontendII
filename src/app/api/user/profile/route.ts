// [2025-03-15 11:18:00] @sebastianascimento - API para buscar dados do perfil do usuário
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const currentDate = "2025-03-15 11:18:00";
    const currentUser = "sebastianascimento";
    
    console.log(`[${currentDate}] @${currentUser} - API de perfil de usuário chamada`);
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log(`[${currentDate}] @${currentUser} - Tentativa de acesso não autenticado`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Obter o ID do usuário da sessão
    const userId = session.user.id;
    
    if (!userId) {
      console.log(`[${currentDate}] @${currentUser} - ID de usuário não encontrado na sessão`);
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }
    
    console.log(`[${currentDate}] @${currentUser} - Buscando dados do usuário ${userId}`);
    
    // Buscar dados do usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        company: true // Incluir dados da empresa associada
      }
    });
    
    if (!user) {
      console.log(`[${currentDate}] @${currentUser} - Usuário ${userId} não encontrado no banco`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Formatar dados para a resposta
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      companyId: user.companyId,
      companyName: user.company?.name || null,
      companyRole: user.role || null
    };
    
    console.log(`[${currentDate}] @${currentUser} - Dados do usuário recuperados com sucesso`);
    
    return NextResponse.json(userProfile);
  } catch (error) {
    const currentDate = "2025-03-15 11:18:00";
    const currentUser = "sebastianascimento";
    
    console.error(`[${currentDate}] @${currentUser} - Erro ao buscar perfil:`, error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}