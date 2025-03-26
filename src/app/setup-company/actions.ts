
"use server";

import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth"; 
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function setupCompanyAction(companyName: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return { 
        error: true, 
        message: "Usuário não autenticado"
      };
    }
    
    
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    });
    
    if (existingUser?.companyId && existingUser?.company) {
      return {
        error: false,
        companyId: existingUser.companyId,
        companyName: existingUser.company.name
      };
    }
    
    const company = await prisma.company.create({
      data: {
        name: companyName
      }
    });
    
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { companyId: company.id }
      });
    } else {
      await prisma.user.create({
        data: {
          name: session.user.name || "Usuário",
          email: session.user.email,
          image: session.user.image || null,
          companyId: company.id
        }
      });
    }
    
    revalidatePath("/dashboard");
    
    return {
      error: false,
      companyId: company.id,
      companyName: company.name
    };
  } catch (error) {
    return {
      error: true,
      message: "Erro ao criar empresa. Por favor tente novamente."
    };
  }
}