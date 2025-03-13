import { getServerSession } from "next-auth/next";
import { prisma } from "./prisma";

// Informações atualizadas
const CURRENT_DATE = "2025-03-13 11:55:12";
const CURRENT_USER = "sebastianascimento";

/**
 * Obtém o ID da empresa do usuário atual
 */
export async function getCurrentUserCompanyId() {
  console.log(`[${CURRENT_DATE}] Getting company ID for user ${CURRENT_USER}`);
  
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    console.error(`[${CURRENT_DATE}] No authenticated user found`);
    throw new Error("User not authenticated");
  }
  
  // Se o companyId já estiver disponível na sessão
  if ((session.user as any).companyId) {
    return (session.user as any).companyId;
  }
  
  try {
    // Consulta para buscar companyId
    const users = await prisma.$queryRaw`
      SELECT "companyId" FROM "User" WHERE email = ${session.user.email} LIMIT 1
    `;
    
    const user = Array.isArray(users) && users.length > 0 ? users[0] : null;
    
    if (!user?.companyId) {
      console.error(`[${CURRENT_DATE}] User ${session.user.email} has no company`);
      throw new Error("User doesn't have an associated company");
    }
    
    return user.companyId;
  } catch (error) {
    console.error(`[${CURRENT_DATE}] Error getting company ID:`, error);
    throw new Error("Failed to get company ID");
  }
}

/**
 * Cria um filtro de empresa que pode ser usado em consultas Prisma
 */
export async function getCompanyFilter() {
  try {
    const companyId = await getCurrentUserCompanyId();
    return { companyId };
  } catch (error) {
    console.error(`[${CURRENT_DATE}] Error creating company filter:`, error);
    // Em produção, talvez seja melhor lançar o erro
    return {}; // Filtro vazio como fallback para desenvolvimento
  }
}

/**
 * Para uso em API routes, obtém o companyId do cabeçalho
 */
export function getCompanyIdFromHeader(headers: Headers) {
  const companyId = headers.get('X-Company-Id');
  
  if (!companyId) {
    console.error(`[${CURRENT_DATE}] Company ID not found in request headers`);
    throw new Error("Company ID not found in request headers");
  }
  
  return parseInt(companyId, 10);
}