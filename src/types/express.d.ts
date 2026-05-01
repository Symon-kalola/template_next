import { UserSession } from "../db/schema/user_sessions.schema";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        sessionId: number;
        roleId: string | null;
      };
      authSession?: UserSession;
    }
  }
}

export {};
