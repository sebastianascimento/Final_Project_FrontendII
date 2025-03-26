import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/app/lib/prisma";

export const FIXED_JWT_SECRET = "sebastianascimento-segredo-fixo-permanente-1234567890-nao-mudar-nunca";

const GOOGLE_CLIENT_ID = "123456789012-seu-client-id-real.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "GOCSPX-seu-secret-real"; 


export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      
      try {
        const existingUsers = await prisma.$queryRaw`
          SELECT * FROM "User" WHERE email = ${user.email} LIMIT 1
        `;
        
        const existingUser = Array.isArray(existingUsers) && existingUsers.length > 0 ? existingUsers[0] : null;

        if (!existingUser) {
          try {
            await prisma.$executeRaw`
              INSERT INTO "Company" (name, "createdAt", "updatedAt")
              VALUES (${`${user.name || 'New'}'s Company`}, NOW(), NOW())
            `;
            
            const companies = await prisma.$queryRaw`
              SELECT id FROM "Company" WHERE name = ${`${user.name || 'New'}'s Company`}
              ORDER BY "createdAt" DESC LIMIT 1
            `;
            
            if (Array.isArray(companies) && companies.length > 0) {
              const companyId = companies[0].id;
              
              await prisma.$executeRaw`
                INSERT INTO "User" (email, name, image, "companyId", role, "createdAt", "updatedAt")
                VALUES (${user.email}, ${user.name || null}, ${user.image || null}, ${companyId}, 'admin', NOW(), NOW())
              `;
              
            }
          } catch (dbError) {
          }
        }
        
        return true;
      } catch (error) {
        return true;
      }
    },
    async jwt({ token, user }) {
      try {
        if (user?.email) {
          const users = await prisma.$queryRaw`
            SELECT u.id, u."companyId", u.role, c.name as "companyName"
            FROM "User" u
            LEFT JOIN "Company" c ON u."companyId" = c.id
            WHERE u.email = ${user.email}
            LIMIT 1
          `;
          
          if (Array.isArray(users) && users.length > 0) {
            const userData = users[0];
            token.userId = userData.id;
            token.companyId = userData.companyId;
            token.companyName = userData.companyName;
            token.role = userData.role;
          }
        }
      } catch (error) {
      }
      
      return token;
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          const user = session.user as any;
          user.id = token.userId;
          user.companyId = token.companyId;
          user.companyName = token.companyName;
          user.role = token.role;
        }
      } catch (error) {
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
  debug: true,
  secret: FIXED_JWT_SECRET, 
};