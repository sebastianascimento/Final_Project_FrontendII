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
      if (account) {
        try {
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
        } catch (error) {
          token.hasCompany = false;
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
        try {
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
        } catch (error) {
        }
      }
    }
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };