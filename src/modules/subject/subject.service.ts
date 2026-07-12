import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

const normalizeSubjectCode = (code: string) => {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    throw new ApiError(400, "Subject code is required");
  }

  return normalizedCode;
};

const normalizeSubjectName = (name: string) => {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new ApiError(400, "Subject name is required");
  }

  return normalizedName;
};

const ensureSemesterExists = async (semesterId: string) => {
  const semester = await prisma.semester.findUnique({
    where: { id: semesterId },
    select: { id: true },
  });

  if (!semester) {
    throw new ApiError(404, "Semester not found");
  }
};

export const getSubjects = async (semesterId?: string) => {
  return prisma.subject.findMany({
    where: {
      ...(semesterId ? { semesterId } : {}),
    },
    select: {
      id: true,
      name: true,
      code: true,
      semesterId: true,
      semester: {
        select: {
          id: true,
          number: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const getSubjectById = async (id: string) => {
  const subject = await prisma.subject.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      semesterId: true,
      semester: {
        select: {
          id: true,
          number: true,
          name: true,
        },
      },
    },
  });

  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  return subject;
};

export const getSubjectsBySemesterId = async (semesterId: string) => {
  await ensureSemesterExists(semesterId);

  return prisma.subject.findMany({
    where: { semesterId },
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const createSubject = async (
  name: string,
  code: string,
  semesterId: string,
) => {
  const normalizedName = normalizeSubjectName(name);
  const normalizedCode = normalizeSubjectCode(code);

  await ensureSemesterExists(semesterId);

  const existingCode = await prisma.subject.findUnique({
    where: { code: normalizedCode },
    select: { id: true },
  });

  if (existingCode) {
    throw new ApiError(409, "Subject code already exists");
  }

  return prisma.subject.create({
    data: {
      name: normalizedName,
      code: normalizedCode,
      semesterId,
    },
    select: {
      id: true,
      name: true,
      code: true,
      semesterId: true,
      semester: {
        select: {
          id: true,
          number: true,
          name: true,
        },
      },
    },
  });
};

export const updateSubject = async (
  id: string,
  payload: {
    name?: string;
    code?: string;
    semesterId?: string;
  },
) => {
  const existingSubject = await prisma.subject.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      semesterId: true,
    },
  });

  if (!existingSubject) {
    throw new ApiError(404, "Subject not found");
  }

  let normalizedName: string | undefined;
  if (payload.name !== undefined) {
    normalizedName = normalizeSubjectName(payload.name);
  }

  let normalizedCode: string | undefined;
  if (payload.code !== undefined) {
    normalizedCode = normalizeSubjectCode(payload.code);

    if (normalizedCode !== existingSubject.code) {
      const duplicateCode = await prisma.subject.findUnique({
        where: { code: normalizedCode },
        select: { id: true },
      });

      if (duplicateCode) {
        throw new ApiError(409, "Subject code already exists");
      }
    }
  }

  if (
    payload.semesterId !== undefined &&
    payload.semesterId !== existingSubject.semesterId
  ) {
    await ensureSemesterExists(payload.semesterId);
  }

  return prisma.subject.update({
    where: { id },
    data: {
      ...(normalizedName !== undefined ? { name: normalizedName } : {}),
      ...(normalizedCode !== undefined ? { code: normalizedCode } : {}),
      ...(payload.semesterId !== undefined
        ? { semesterId: payload.semesterId }
        : {}),
    },
    select: {
      id: true,
      name: true,
      code: true,
      semesterId: true,
      semester: {
        select: {
          id: true,
          number: true,
          name: true,
        },
      },
    },
  });
};

export const deleteSubject = async (id: string) => {
  const existingSubject = await prisma.subject.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingSubject) {
    throw new ApiError(404, "Subject not found");
  }

  const documentCount = await prisma.document.count({
    where: { subjectId: id },
  });

  if (documentCount > 0) {
    throw new ApiError(
      400,
      "Cannot delete subject because it has documents. Remove documents first.",
    );
  }

  try {
    return await prisma.subject.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new ApiError(
        400,
        "Cannot delete subject because it is referenced by other records",
      );
    }

    throw error;
  }
};
