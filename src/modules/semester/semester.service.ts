import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

const validateSemesterNumber = (number: number) => {
  if (!Number.isInteger(number) || number < 1 || number > 8) {
    throw new ApiError(400, "Semester number must be between 1 and 8");
  }
};

const normalizeSemesterName = (name: string) => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new ApiError(400, "Semester name is required");
  }

  return trimmedName;
};

export const getSemesters = async () => {
  return prisma.semester.findMany({
    select: {
      id: true,
      number: true,
      name: true,
    },
    orderBy: {
      number: "asc",
    },
  });
};

export const getSemesterById = async (id: string) => {
  const semester = await prisma.semester.findUnique({
    where: { id },
    select: {
      id: true,
      number: true,
      name: true,
      subjects: {
        select: {
          id: true,
          name: true,
          code: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!semester) {
    throw new ApiError(404, "Semester not found");
  }

  return semester;
};

export const createSemester = async (number: number, name: string) => {
  validateSemesterNumber(number);
  const normalizedName = normalizeSemesterName(name);

  const existingSemester = await prisma.semester.findUnique({
    where: { number },
    select: { id: true },
  });

  if (existingSemester) {
    throw new ApiError(409, "Semester number already exists");
  }

  return prisma.semester.create({
    data: {
      number,
      name: normalizedName,
    },
    select: {
      id: true,
      number: true,
      name: true,
    },
  });
};

export const updateSemester = async (
  id: string,
  payload: {
    number?: number;
    name?: string;
  },
) => {
  const existingSemester = await prisma.semester.findUnique({
    where: { id },
    select: { id: true, number: true },
  });

  if (!existingSemester) {
    throw new ApiError(404, "Semester not found");
  }

  if (payload.number !== undefined) {
    validateSemesterNumber(payload.number);

    if (payload.number !== existingSemester.number) {
      const duplicate = await prisma.semester.findUnique({
        where: { number: payload.number },
        select: { id: true },
      });

      if (duplicate) {
        throw new ApiError(409, "Semester number already exists");
      }
    }
  }

  if (payload.name !== undefined) {
    payload.name = normalizeSemesterName(payload.name);
  }

  return prisma.semester.update({
    where: { id },
    data: {
      ...(payload.number !== undefined ? { number: payload.number } : {}),
      ...(payload.name !== undefined ? { name: payload.name } : {}),
    },
    select: {
      id: true,
      number: true,
      name: true,
    },
  });
};

export const deleteSemester = async (id: string) => {
  const existingSemester = await prisma.semester.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingSemester) {
    throw new ApiError(404, "Semester not found");
  }

  const subjectCount = await prisma.subject.count({
    where: { semesterId: id },
  });

  if (subjectCount > 0) {
    throw new ApiError(
      400,
      "Cannot delete semester because it has subjects. Remove subjects first.",
    );
  }

  return prisma.semester.delete({
    where: { id },
    select: {
      id: true,
      number: true,
      name: true,
    },
  });
};
