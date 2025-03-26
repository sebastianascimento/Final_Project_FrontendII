import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";


export async function getCompanyId(): Promise<string> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.companyId) {
    redirect("/setup-company");
  }
  
  try {
    const companyExists = await prisma.company.findUnique({
      where: { id: session.user.companyId }
    });
    
    if (!companyExists) {
      redirect("/setup-company?error=company-not-found");
    }
    
    return session.user.companyId;
  } catch (error) {
    redirect("/setup-company?error=database-error");
  }
}


export async function withCompanyFilter(baseFilter = {}) {
  const companyId = await getCompanyId();
  return { ...baseFilter, companyId };
}