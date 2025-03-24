import { getServerSession } from "next-auth/next";
import { prisma } from "./prisma";




export async function getCurrentUserCompanyId() {
  
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    throw new Error("User not authenticated");
  }
  
  if ((session.user as any).companyId) {
    return (session.user as any).companyId;
  }
  
  try {
    const users = await prisma.$queryRaw`
      SELECT "companyId" FROM "User" WHERE email = ${session.user.email} LIMIT 1
    `;
    
    const user = Array.isArray(users) && users.length > 0 ? users[0] : null;
    
    if (!user?.companyId) {
      throw new Error("User doesn't have an associated company");
    }
    
    return user.companyId;
  } catch (error) {
    throw new Error("Failed to get company ID");
  }
}


export async function getCompanyFilter() {
  try {
    const companyId = await getCurrentUserCompanyId();
    return { companyId };
  } catch (error) {
    return {}; 
  }
}


export function getCompanyIdFromHeader(headers: Headers) {
  const companyId = headers.get('X-Company-Id');
  
  if (!companyId) {
    throw new Error("Company ID not found in request headers");
  }
  
  return parseInt(companyId, 10);
}