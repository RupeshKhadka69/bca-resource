import { Prisma, Role, UserStatus } from "../../../generated/prisma/index.js";

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { hashPassword } from "../../utils/password.js";
import type {
  CreateStudentInput,
  PaginationQueryInput,
  ResetStudentPasswordInput,
  UpdateStudentInput,
} from "./student.schema.js";

const safeStudentSelect = {
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

export type SafeStudent = Prisma.UserGetPayload<{
  select: typeof safeStudentSelect;
}>;

const findStudentOrThrow = async (id: string): Promise<SafeStudent> => {
  const student = await prisma.user.findUnique({
    where: { id },
    select: safeStudentSelect,
  });

  if (!student || student.role !== Role.STUDENT) {
    throw new ApiError(404, "Student not found");
  }

  return student;
};

export const createStudent = async (
  input: CreateStudentInput,
): Promise<SafeStudent> => {
  return prisma.user.create({
    data: {
      studentId: input.studentId,
      name: input.name,
      password: await hashPassword(input.temporaryPassword),
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: true,
      username: null,
      batchId: null,
      currentSemesterId: null,
    },
    select: safeStudentSelect,
  });
};

export const listStudents = async (query: PaginationQueryInput) => {
  const skip = (query.page - 1) * query.limit;

  const [students, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: { role: Role.STUDENT },
      select: safeStudentSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.user.count({ where: { role: Role.STUDENT } }),
  ]);

  return {
    students,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

export const getStudentById = async (id: string): Promise<SafeStudent> => {
  return findStudentOrThrow(id);
};

export const updateStudent = async (
  id: string,
  input: UpdateStudentInput,
): Promise<SafeStudent> => {
  await findStudentOrThrow(id);

  return prisma.user.update({
    where: { id },
    data: {
      ...(input.studentId !== undefined ? { studentId: input.studentId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined
        ? { status: input.status as UserStatus }
        : {}),
    },
    select: safeStudentSelect,
  });
};

export const deactivateStudent = async (id: string): Promise<SafeStudent> => {
  await findStudentOrThrow(id);

  return prisma.user.update({
    where: { id },
    data: {
      status: UserStatus.INACTIVE,
    },
    select: safeStudentSelect,
  });
};

export const resetStudentPassword = async (
  id: string,
  input: ResetStudentPasswordInput,
): Promise<SafeStudent> => {
  await findStudentOrThrow(id);

  return prisma.user.update({
    where: { id },
    data: {
      password: await hashPassword(input.temporaryPassword),
      mustChangePassword: true,
    },
    select: safeStudentSelect,
  });
};
