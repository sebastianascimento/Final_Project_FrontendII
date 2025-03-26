import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      hasCompany: boolean;
      companyId: string; 
      companyName: string; 
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    companyId?: string | null;
    companyName?: string | null;
  }
}