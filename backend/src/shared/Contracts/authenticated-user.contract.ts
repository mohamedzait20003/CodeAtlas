import { UserRole } from '@/shared/Domain/enums/user-role.enum';

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  sit: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- required for Express type merging
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      /** Credits reserved by `CreditsGuard`; the handler records it on the run. */
      creditsHeld?: number;
    }
  }
}
