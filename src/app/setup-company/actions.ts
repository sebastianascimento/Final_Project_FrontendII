"use server";

import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth"; 
import { revalidatePath } from "next/cache";
import { authOptions } from "../api/auth/[...nextauth]/auth";
import { cookies } from 'next/headers';

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
        companyName: existingUser.company.name,
        needsSessionRefresh: false
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

    // Add 'await' here to fix the type error
    const cookieStore = await cookies();
    cookieStore.set('next-auth.session-token', '', { expires: new Date(0) });
    
    revalidatePath("/dashboard");
    
    return {
      error: false,
      companyId: company.id,
      companyName: company.name,
      needsSessionRefresh: true  // Sinal para o cliente que a sessão precisa ser atualizada
    };
  } catch (error) {
    console.error("Error setting up company:", error);
    return {
      error: true,
      message: "Erro ao criar empresa. Por favor tente novamente."
    };
  }
}