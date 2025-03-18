import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      hasCompany: boolean;
      companyId: string; // Mantemos como string porque queremos que seja obrigatório
      companyName: string; // Mantemos como string porque queremos que seja obrigatório
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    // Atualizamos para aceitar null
    companyId?: string | null;
    companyName?: string | null;
  }
}