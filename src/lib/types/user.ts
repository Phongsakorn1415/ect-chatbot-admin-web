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
      email: string
      title: string;
      firstName: string;
      lastName: string;
      role: string;
      image?: string | null;
    }
  }
}

export interface IUser {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  role: string;
}