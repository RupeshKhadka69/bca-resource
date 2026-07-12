import type { Role, UserStatus } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  studentId: string | null;
  username: string | null;
  name: string;
  role: Role;
  status: UserStatus;
  mustChangePassword: boolean;
  batchId: string | null;
  currentSemesterId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      file?: Express.Multer.File;
    }
  }
}

export {};
