// [2025-03-14 11:06:59] @sebastianascimento - Ação para configurar empresa

"use server";

import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth"; 
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function setupCompanyAction(companyName: string) {
  try {
    // Verificar se tem usuário logado
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return { 
        error: true, 
        message: "Usuário não autenticado"
      };
    }
    
    console.log(`[2025-03-14 11:06:59] Configurando empresa ${companyName} para ${session.user.email}`);
    
    // Verificar se o usuário já tem uma empresa
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    });
    
    // Se já tem empresa, retornar
    if (existingUser?.companyId && existingUser?.company) {
      return {
        error: false,
        companyId: existingUser.companyId,
        companyName: existingUser.company.name
      };
    }
    
    // Criar nova empresa
    const company = await prisma.company.create({
      data: {
        name: companyName
      }
    });
    
    // Associar empresa ao usuário
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { companyId: company.id }
      });
    } else {
      // Criar usuário se não existir
      await prisma.user.create({
        data: {
          name: session.user.name || "Usuário",
          email: session.user.email,
          image: session.user.image || null,
          companyId: company.id
        }
      });
    }
    
    console.log(`[2025-03-14 11:06:59] Empresa criada com sucesso: ${company.name} (${company.id})`);
    revalidatePath("/dashboard");
    
    return {
      error: false,
      companyId: company.id,
      companyName: company.name
    };
  } catch (error) {
    console.error("[2025-03-14 11:06:59] Erro ao configurar empresa:", error);
    return {
      error: true,
      message: "Erro ao criar empresa. Por favor tente novamente."
    };
  }
}