// [2025-03-14 11:13:35] @sebastianascimento - Função getCompanyId robusta
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

/**
 * Obtém o ID da empresa do usuário atual e verifica se existe no banco.
 * Redireciona para setup se não encontrar.
 */
export async function getCompanyId(): Promise<string> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.companyId) {
    console.log("[2025-03-14 11:13:35] Usuário sem empresa, redirecionando");
    redirect("/setup-company");
  }
  
  try {
    // Verificar se a empresa ainda existe no banco
    const companyExists = await prisma.company.findUnique({
      where: { id: session.user.companyId }
    });
    
    if (!companyExists) {
      console.log(`[2025-03-14 11:13:35] Empresa ${session.user.companyId} não existe mais`);
      redirect("/setup-company?error=company-not-found");
    }
    
    return session.user.companyId;
  } catch (error) {
    console.error("[2025-03-14 11:13:35] Erro ao verificar empresa:", error);
    redirect("/setup-company?error=database-error");
  }
}

/**
 * Helper para criar filtros Prisma com companyId
 */
export async function withCompanyFilter(baseFilter = {}) {
  const companyId = await getCompanyId();
  return { ...baseFilter, companyId };
}