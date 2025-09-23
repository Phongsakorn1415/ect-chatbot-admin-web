import 'next-auth';

declare module "next-auth" {
  interface User {
    id: string;
    title: string;
    firstName: string;
    lastName: string;
    role: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}