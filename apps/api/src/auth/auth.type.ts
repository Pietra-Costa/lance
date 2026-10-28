import { UserRole } from 'generated/prisma/enums';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  publicPseudonym: string;
}
