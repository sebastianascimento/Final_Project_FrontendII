import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/app/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, account, trigger, session }) {
      // Durante o login inicial (account presente)
      if (account) {
          const user = await prisma.user.findUnique({
            where: { email: token.email as string },
            include: { company: true }
          });
          
          if (user) {
            token.userId = user.id;
          }
          
          if (user?.companyId) {
            token.companyId = user.companyId;
            token.companyName = user.company?.name;
            token.hasCompany = true;
          } else {
            token.hasCompany = false;
          }
      }
      
      // Quando a sessão é explicitamente atualizada via update()
      if (trigger === "update" && session?.user) {
        console.log("Update trigger received:", session);
        
        // Atualiza o token com os dados da sessão
        if (session.user.companyId) {
          token.companyId = session.user.companyId;
          token.companyName = session.user.companyName;
          token.hasCompany = true;
        }
        
        // Também verifica no banco de dados para garantir dados atualizados
        const freshUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          include: { company: true }
        });
        
        if (freshUser?.companyId) {
          token.companyId = freshUser.companyId;
          token.companyName = freshUser.company?.name;
          token.hasCompany = true;
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.userId as string || token.sub as string;
        session.user.hasCompany = !!token.hasCompany; 
        
        if (token.companyId) {
          session.user.companyId = token.companyId as string;
          session.user.companyName = token.companyName as string;
        }
      }
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/auth-redirect`;
      }
      return url;
    },
  },
  
  events: {
    async signIn({ user }) {
      if (user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });
          
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || user.email.split('@')[0],
                image: user.image
              }
            });
          }
      }
    }
  },
};