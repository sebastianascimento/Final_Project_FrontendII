// [2025-03-14 11:34:47] @sebastianascimento - Configuração NextAuth aprimorada
import NextAuth, { NextAuthOptions } from "next-auth";
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
    async jwt({ token, account }) {
      // Só é executado no login inicial
      if (account) {
        try {
          // Verificar se o usuário existe e tem empresa
          const user = await prisma.user.findUnique({
            where: { email: token.email as string },
            include: { company: true }
          });
          
          // Adicionar ID do usuário ao token para referência futura
          if (user) {
            token.userId = user.id;
          }
          
          if (user?.companyId) {
            // Usuário tem empresa, adicionar ao token
            token.companyId = user.companyId;
            token.companyName = user.company?.name;
            token.hasCompany = true; // Flag explícita para facilitar verificações
          } else {
            // Usuário não tem empresa
            token.hasCompany = false; // Flag explícita para indicar falta de empresa
            console.log(`[2025-03-14 11:34:47] @sebastianascimento - Usuário ${token.email} sem empresa associada`);
          }
        } catch (error) {
          console.error("[2025-03-14 11:34:47] Erro ao verificar empresa:", error);
          token.hasCompany = false; // Em caso de erro, assumir que não tem empresa
        }
      }
      return token;
    },
    
    async session({ session, token }) {
      // Adicionar dados à sessão
      if (session?.user) {
        session.user.id = token.userId as string || token.sub as string;
        session.user.hasCompany = !!token.hasCompany; // Adicionar flag à sessão
        
        // Incluir dados da empresa, se existirem
        if (token.companyId) {
          session.user.companyId = token.companyId as string;
          session.user.companyName = token.companyName as string;
        }
      }
      return session;
    },
    
    // Adicionar redirecionamento pós-login
    async redirect({ url, baseUrl }) {
      // Redirecionar para verificação de conta após login
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/auth-redirect`;
      }
      return url;
    },
  },
  
  // Adicionar evento para criação automática de usuários
  events: {
    async signIn({ user }) {
      if (user.email) {
        try {
          // Verificar se o usuário já existe no banco
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });
          
          // Se não existir, criar automaticamente
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || user.email.split('@')[0],
                image: user.image
              }
            });
            console.log(`[2025-03-14 11:34:47] @sebastianascimento - Novo usuário criado: ${user.email}`);
          }
        } catch (error) {
          console.error("[2025-03-14 11:34:47] Erro ao criar usuário:", error);
        }
      }
    }
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };