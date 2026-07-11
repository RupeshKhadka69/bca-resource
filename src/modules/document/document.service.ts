import { DocumentType, Prisma } from "../../../generated/prisma/index.js";

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { deletePdf, uploadPdf } from "../../utils/cloudinary.js";

const allowedDocumentTypes = new Set(Object.values(DocumentType));

const documentSelect = {
  id: true,
  title: true,
  type: true,
  pdfUrl: true,
  year: true,
  subject: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  createdAt: true,
} as const;

const internalDocumentSelect = {
  id: true,
  title: true,
  type: true,
  pdfUrl: true,
  publicId: true,
  year: true,
  subjectId: true,
  uploadedById: true,
  subject: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const;

type DocumentTypeValue = (typeof DocumentType)[keyof typeof DocumentType];

type DocumentRecord = Prisma.DocumentGetPayload<{
  select: typeof documentSelect;
}>;

type InternalDocumentRecord = Prisma.DocumentGetPayload<{
  select: typeof internalDocumentSelect;
}>;

const normalizeTitle = (title: string) => {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    throw new ApiError(400, "Title is required");
  }

  return normalizedTitle;
};

const parseDocumentType = (value: string) => {
  const normalizedValue = value.trim().toUpperCase();

  if (!allowedDocumentTypes.has(normalizedValue as DocumentTypeValue)) {
    throw new ApiError(
      400,
      "Invalid document type. Allowed types are SYLLABUS, NOTE, QUESTION_PAPER",
    );
  }

  return normalizedValue as DocumentTypeValue;
};

const parseYear = (value: string | undefined) => {
  if (value === undefined || value === "") {
    return undefined;
  }

  const year = Number(value);

  if (!Number.isInteger(year)) {
    throw new ApiError(400, "Year must be a valid integer");
  }

  return year;
};

const ensureSubjectExists = async (subjectId: string) => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: {
      id: true,
    },
  });

  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  return subject;
};

const getDocumentOrThrow = async (
  id: string,
): Promise<InternalDocumentRecord> => {
  const document = await prisma.document.findUnique({
    where: { id },
    select: internalDocumentSelect,
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  return document;
};

const finalizeYear = (
  type: DocumentTypeValue,
  year: number | undefined,
  existingYear?: number | null,
) => {
  if (type === DocumentType.QUESTION_PAPER) {
    return year ?? existingYear ?? null;
  }

  return null;
};

const uploadDocumentPdfToCloudinary = async (buffer: Buffer) => {
  try {
    return await uploadPdf(buffer);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown Cloudinary upload error";
    throw new ApiError(502, `Failed to upload PDF to Cloudinary: ${message}`);
  }
};

const deleteDocumentPdfFromCloudinary = async (publicId: string) => {
  try {
    const result = await deletePdf(publicId);

    if (result !== "ok" && result !== "not found") {
      throw new Error(`Cloudinary delete returned ${result}`);
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown Cloudinary delete error";
    throw new ApiError(502, `Failed to delete PDF from Cloudinary: ${message}`);
  }
};

export const getDocuments = async (filters: {
  subjectId?: string;
  type?: string;
}): Promise<DocumentRecord[]> => {
  const type = filters.type ? parseDocumentType(filters.type) : undefined;

  return prisma.document.findMany({
    where: {
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      ...(type ? { type } : {}),
    },
    select: documentSelect,
    orderBy:
      type === DocumentType.QUESTION_PAPER
        ? [{ year: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
  });
};

export const getDocumentById = async (id: string): Promise<DocumentRecord> => {
  const document = await prisma.document.findUnique({
    where: { id },
    select: documentSelect,
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  return document;
};

export const createDocument = async (input: {
  title: string;
  type: string;
  subjectId: string;
  year?: string;
  pdf: Buffer;
  uploadedById: string;
}): Promise<DocumentRecord> => {
  const title = normalizeTitle(input.title);
  const type = parseDocumentType(input.type);

  await ensureSubjectExists(input.subjectId);

  const parsedYear = parseYear(input.year);
  const year = finalizeYear(type, parsedYear);

  if (type === DocumentType.QUESTION_PAPER && year === null) {
    throw new ApiError(400, "Year is required for QUESTION_PAPER documents");
  }

  const uploadedFile = await uploadDocumentPdfToCloudinary(input.pdf);

  try {
    return await prisma.document.create({
      data: {
        title,
        type,
        subjectId: input.subjectId,
        year,
        pdfUrl: uploadedFile.secure_url,
        publicId: uploadedFile.public_id,
        uploadedById: input.uploadedById,
      },
      select: documentSelect,
    });
  } catch (error) {
    await deleteDocumentPdfFromCloudinary(uploadedFile.public_id);
    throw error;
  }
};

export const updateDocument = async (input: {
  id: string;
  title?: string;
  type?: string;
  subjectId?: string;
  year?: string;
  pdf?: Buffer;
}): Promise<DocumentRecord> => {
  const existingDocument = await getDocumentOrThrow(input.id);

  const title =
    input.title !== undefined ? normalizeTitle(input.title) : undefined;
  const type =
    input.type !== undefined
      ? parseDocumentType(input.type)
      : existingDocument.type;
  const subjectId =
    input.subjectId !== undefined
      ? input.subjectId
      : existingDocument.subjectId;

  if (
    input.subjectId !== undefined &&
    input.subjectId !== existingDocument.subjectId
  ) {
    await ensureSubjectExists(input.subjectId);
  }

  const parsedYear = parseYear(input.year);
  const year = finalizeYear(type, parsedYear, existingDocument.year);

  if (type === DocumentType.QUESTION_PAPER && year === null) {
    throw new ApiError(400, "Year is required for QUESTION_PAPER documents");
  }

  let uploadedFile: { secure_url: string; public_id: string } | undefined;

  if (input.pdf) {
    uploadedFile = await uploadDocumentPdfToCloudinary(input.pdf);
  }

  try {
    const updatedDocument = await prisma.document.update({
      where: { id: input.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(input.subjectId !== undefined ? { subjectId } : {}),
        ...(year !== undefined ? { year } : {}),
        ...(uploadedFile
          ? {
              pdfUrl: uploadedFile.secure_url,
              publicId: uploadedFile.public_id,
            }
          : {}),
      },
      select: documentSelect,
    });

    if (uploadedFile) {
      await deleteDocumentPdfFromCloudinary(existingDocument.publicId);
    }

    return updatedDocument;
  } catch (error) {
    if (uploadedFile) {
      await deleteDocumentPdfFromCloudinary(uploadedFile.public_id);
    }

    throw error;
  }
};

export const deleteDocument = async (id: string) => {
  const document = await getDocumentOrThrow(id);

  await deleteDocumentPdfFromCloudinary(document.publicId);

  try {
    return await prisma.document.delete({
      where: { id },
      select: documentSelect,
    });
  } catch (error) {
    throw error;
  }
};
