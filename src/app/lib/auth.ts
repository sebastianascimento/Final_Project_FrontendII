import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "./prisma";

// Valores constantes para logs
const CURRENT_DATE = "2025-03-13 11:48:00";
const CURRENT_USER = "sebastianascimento";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      console.log(`[${CURRENT_DATE}] User ${user.email} attempting to sign in`);
      
      try {
        // Usar SQL bruto para verificar se o usuário existe e criar se necessário
        const existingUserResult = await prisma.$queryRaw`
          SELECT * FROM "User" WHERE email = ${user.email} LIMIT 1
        `;
        
        const existingUser = Array.isArray(existingUserResult) && existingUserResult.length > 0 
          ? existingUserResult[0] 
          : null;

        if (!existingUser) {
          // Criar nova empresa usando SQL bruto
          await prisma.$executeRaw`
            INSERT INTO "Company" (name, "createdAt", "updatedAt")
            VALUES (${`${user.name || 'New'}'s Company`}, NOW(), NOW())
          `;
          
          // Buscar o ID da empresa recém-criada
          const newCompanyResult = await prisma.$queryRaw`
            SELECT id FROM "Company" 
            WHERE name = ${`${user.name || 'New'}'s Company`}
            ORDER BY "createdAt" DESC LIMIT 1
          `;
          
          const newCompany = Array.isArray(newCompanyResult) && newCompanyResult.length > 0 
            ? newCompanyResult[0] 
            : null;
          
          if (newCompany) {
            // Criar usuário associado à empresa usando SQL bruto
            await prisma.$executeRaw`
              INSERT INTO "User" (email, name, image, "companyId", role, "createdAt", "updatedAt")
              VALUES (
                ${user.email}, 
                ${user.name || null}, 
                ${user.image || null}, 
                ${newCompany.id}, 
                ${'admin'}, 
                NOW(), 
                NOW()
              )
            `;
            
            console.log(`[${CURRENT_DATE}] Created new company (ID: ${newCompany.id}) for user: ${user.email}`);
          }
        }

        return true;
      } catch (error) {
        console.error(`[${CURRENT_DATE}] Error during sign-in:`, error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user && user.email) {
        try {
          // Buscar dados do usuário com SQL bruto
          const userDataResult = await prisma.$queryRaw`
            SELECT u.id, u."companyId", u.role, c.name as "companyName"
            FROM "User" u
            JOIN "Company" c ON u."companyId" = c.id
            WHERE u.email = ${user.email}
            LIMIT 1
          `;
          
          const userData = Array.isArray(userDataResult) && userDataResult.length > 0 
            ? userDataResult[0] 
            : null;
          
          if (userData) {
            token.userId = userData.id;
            token.companyId = userData.companyId;
            token.companyName = userData.companyName;
            token.role = userData.role;
          }
        } catch (error) {
          console.error(`[${CURRENT_DATE}] Error fetching user data:`, error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Use type assertion para dizer ao TypeScript sobre nossas propriedades personalizadas
        const user = session.user as any;
        
        user.id = token.userId;
        user.companyId = token.companyId;
        user.companyName = token.companyName;
        user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};