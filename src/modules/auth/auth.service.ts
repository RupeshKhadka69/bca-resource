import { Prisma, Role, UserStatus } from "@prisma/client";

import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { signJwt } from "../../utils/jwt.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import type { ChangePasswordInput, LoginInput } from "./auth.schema.js";

const safeUserSelect = {
  id: true,
  studentId: true,
  username: true,
  name: true,
  role: true,
  status: true,
  mustChangePassword: true,
  batchId: true,
  currentSemesterId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type SafeUser = Prisma.UserGetPayload<{ select: typeof safeUserSelect }>;

const getUserByIdentifier = async (identifier: string) => {
  return prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { studentId: identifier }],
    },
    select: {
      id: true,
      studentId: true,
      username: true,
      name: true,
      password: true,
      role: true,
      status: true,
      mustChangePassword: true,
      batchId: true,
      currentSemesterId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const login = async (input: LoginInput) => {
  const identifier = input.identifier ?? input.studentId;

  if (!identifier) {
    throw new ApiError(400, "Identifier is required");
  }

  const user = await getUserByIdentifier(identifier);

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new ApiError(403, "Account is not active");
  }

  const isPasswordValid = await comparePassword(input.password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = signJwt(
    {
      userId: user.id,
      role: user.role,
    },
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN,
  );

  const { password: _password, ...safeUser } = user;

  return {
    accessToken,
    user: safeUser,
  };
};

export const changePassword = async (
  userId: string,
  input: ChangePasswordInput,
): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isCurrentPasswordValid = await comparePassword(
    input.currentPassword,
    user.password,
  );

  if (!isCurrentPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      password: await hashPassword(input.newPassword),
      mustChangePassword: false,
    },
    select: safeUserSelect,
  });
};

export const getCurrentUser = async (userId: string): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};
