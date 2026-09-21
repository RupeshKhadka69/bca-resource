import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { deletePdf, uploadPdf } from "../../utils/cloudinary.js";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const assignmentSelect = {
  id: true,
  title: true,
  description: true,
  assignedDate: true,
  dueDate: true,
  maxMarks: true,
  pdfUrl: true,
  subject: {
    select: {
      id: true,
      name: true,
      code: true,
      semester: {
        select: {
          id: true,
          number: true,
          name: true,
        },
      },
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const;

const internalAssignmentSelect = {
  id: true,
  title: true,
  description: true,
  assignedDate: true,
  dueDate: true,
  maxMarks: true,
  pdfUrl: true,
  publicId: true,
  subjectId: true,
  createdById: true,
  subject: {
    select: {
      id: true,
      name: true,
      code: true,
      semester: {
        select: {
          id: true,
          number: true,
          name: true,
        },
      },
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const;

type AssignmentRecord = Prisma.AssignmentGetPayload<{
  select: typeof assignmentSelect;
}>;

type InternalAssignmentRecord = Prisma.AssignmentGetPayload<{
  select: typeof internalAssignmentSelect;
}>;

const validateUuid = (value: string, fieldName: string) => {
  if (!uuidRegex.test(value)) {
    throw new ApiError(400, `${fieldName} must be a valid UUID`);
  }
};

const normalizeTitle = (title: string) => {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    throw new ApiError(400, "Title is required");
  }

  return normalizedTitle;
};

const normalizeDescription = (description?: string) => {
  if (description === undefined) {
    return undefined;
  }

  const normalizedDescription = description.trim();
  return normalizedDescription ? normalizedDescription : null;
};

const parseDate = (value: string, fieldName: string) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }

  return parsedDate;
};

const parseDueDate = (value?: string) => {
  if (value === undefined) {
    return undefined;
  }

  if (!value.trim()) {
    return null;
  }

  return parseDate(value, "dueDate");
};

const parseMaxMarks = (value?: string | number) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new ApiError(400, "maxMarks must be a valid positive number");
  }

  return parsedValue;
};

const ensureSubjectExists = async (subjectId: string) => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });

  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }
};

const getAssignmentOrThrow = async (
  id: string,
): Promise<InternalAssignmentRecord> => {
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    select: internalAssignmentSelect,
  });

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  return assignment;
};

const uploadAssignmentPdfToCloudinary = async (
  buffer: Buffer,
  originalName: string,
) => {
  try {
    return await uploadPdf(buffer, originalName, "bca-resources/assignments");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown Cloudinary upload error";

    throw new ApiError(502, `Failed to upload PDF to Cloudinary: ${message}`);
  }
};

const deleteAssignmentPdfFromCloudinary = async (publicId: string) => {
  try {
    const result = await deletePdf(publicId);

    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary delete returned ${result.result}`);
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown Cloudinary delete error";

    throw new ApiError(502, `Failed to delete PDF from Cloudinary: ${message}`);
  }
};

export const getAssignments = async (filters: {
  subjectId?: string;
}): Promise<AssignmentRecord[]> => {
  if (filters.subjectId) {
    validateUuid(filters.subjectId, "subjectId");
  }

  return prisma.assignment.findMany({
    where: {
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
    },
    select: assignmentSelect,
    orderBy: [{ assignedDate: "desc" }, { createdAt: "desc" }],
  });
};

export const getAssignmentById = async (
  id: string,
): Promise<AssignmentRecord> => {
  validateUuid(id, "Assignment id");

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    select: assignmentSelect,
  });

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  return assignment;
};

export const createAssignment = async (input: {
  title: string;
  description?: string;
  assignedDate: string;
  dueDate?: string;
  maxMarks?: string | number;
  subjectId: string;
  createdById: string;
  pdf?: Buffer;
  pdfOriginalName?: string;
}): Promise<AssignmentRecord> => {
  validateUuid(input.subjectId, "subjectId");
  validateUuid(input.createdById, "createdById");

  const title = normalizeTitle(input.title);
  const description = normalizeDescription(input.description);
  const assignedDate = parseDate(input.assignedDate, "assignedDate");
  const dueDate = parseDueDate(input.dueDate);
  const maxMarks = parseMaxMarks(input.maxMarks);

  await ensureSubjectExists(input.subjectId);

  let uploadedFile: { secure_url: string; public_id: string } | undefined;

  if (input.pdf && input.pdfOriginalName) {
    uploadedFile = await uploadAssignmentPdfToCloudinary(
      input.pdf,
      input.pdfOriginalName,
    );
  }

  try {
    return await prisma.assignment.create({
      data: {
        title,
        ...(description !== undefined ? { description } : {}),
        assignedDate,
        ...(dueDate !== undefined ? { dueDate } : {}),
        ...(maxMarks !== undefined ? { maxMarks } : {}),
        ...(uploadedFile
          ? {
              pdfUrl: uploadedFile.secure_url,
              publicId: uploadedFile.public_id,
            }
          : {}),
        subjectId: input.subjectId,
        createdById: input.createdById,
      },
      select: assignmentSelect,
    });
  } catch (error) {
    if (uploadedFile) {
      await deleteAssignmentPdfFromCloudinary(uploadedFile.public_id);
    }

    throw error;
  }
};

export const updateAssignment = async (input: {
  id: string;
  title?: string;
  description?: string;
  assignedDate?: string;
  dueDate?: string;
  maxMarks?: string | number;
  subjectId?: string;
  pdf?: Buffer;
  pdfOriginalName?: string;
}): Promise<AssignmentRecord> => {
  validateUuid(input.id, "Assignment id");

  const existingAssignment = await getAssignmentOrThrow(input.id);

  const title =
    input.title !== undefined ? normalizeTitle(input.title) : undefined;
  const description = normalizeDescription(input.description);
  const assignedDate =
    input.assignedDate !== undefined
      ? parseDate(input.assignedDate, "assignedDate")
      : undefined;
  const dueDate = parseDueDate(input.dueDate);
  const maxMarks = parseMaxMarks(input.maxMarks);

  const subjectId =
    input.subjectId !== undefined
      ? input.subjectId
      : existingAssignment.subjectId;

  if (input.subjectId !== undefined) {
    validateUuid(input.subjectId, "subjectId");
  }

  if (
    input.subjectId !== undefined &&
    input.subjectId !== existingAssignment.subjectId
  ) {
    await ensureSubjectExists(input.subjectId);
  }

  let uploadedFile: { secure_url: string; public_id: string } | undefined;

  if (input.pdf && input.pdfOriginalName) {
    uploadedFile = await uploadAssignmentPdfToCloudinary(
      input.pdf,
      input.pdfOriginalName,
    );
  }

  try {
    const assignment = await prisma.assignment.update({
      where: { id: input.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(assignedDate !== undefined ? { assignedDate } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
        ...(maxMarks !== undefined ? { maxMarks } : {}),
        ...(input.subjectId !== undefined ? { subjectId } : {}),
        ...(uploadedFile
          ? {
              pdfUrl: uploadedFile.secure_url,
              publicId: uploadedFile.public_id,
            }
          : {}),
      },
      select: assignmentSelect,
    });

    if (uploadedFile && existingAssignment.publicId) {
      await deleteAssignmentPdfFromCloudinary(existingAssignment.publicId);
    }

    return assignment;
  } catch (error) {
    if (uploadedFile) {
      await deleteAssignmentPdfFromCloudinary(uploadedFile.public_id);
    }

    throw error;
  }
};

export const deleteAssignment = async (
  id: string,
): Promise<AssignmentRecord> => {
  validateUuid(id, "Assignment id");

  const assignment = await getAssignmentOrThrow(id);

  if (assignment.publicId) {
    await deleteAssignmentPdfFromCloudinary(assignment.publicId);
  }

  return prisma.assignment.delete({
    where: { id },
    select: assignmentSelect,
  });
};
