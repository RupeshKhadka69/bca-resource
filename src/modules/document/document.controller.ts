import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler.js";
import { ApiError } from "../../utils/api-error.js";
import {
  createDocument,
  deleteDocument,
  getDocumentById,
  getDocuments,
  updateDocument,
} from "./document.service.js";

const getParamValue = (value: string | string[] | undefined, key: string) => {
  if (typeof value !== "string") {
    throw new ApiError(400, `${key} is required`);
  }

  return value;
};

export const getDocumentsController = asyncHandler(
  async (req: Request, res: Response) => {
    const subjectId =
      typeof req.query.subjectId === "string" ? req.query.subjectId : undefined;
    const type =
      typeof req.query.type === "string" ? req.query.type : undefined;

    const documents = await getDocuments({ subjectId, type });

    res.status(200).json({
      success: true,
      data: documents,
    });
  },
);

export const getDocumentController = asyncHandler(
  async (req: Request, res: Response) => {
    const documentId = getParamValue(req.params.id, "Document id");
    const document = await getDocumentById(documentId);

    res.status(200).json({
      success: true,
      data: document,
    });
  },
);

export const createDocumentController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }
    console.log("title", req.body);
    const title =
      typeof req.body.title === "string" ? req.body.title : undefined;
    const type = typeof req.body.type === "string" ? req.body.type : undefined;
    const subjectId =
      typeof req.body.subjectId === "string" ? req.body.subjectId : undefined;
    const year = typeof req.body.year === "string" ? req.body.year : undefined;

    if (!title || !type || !subjectId) {
      throw new ApiError(400, "title, type and subjectId are required");
    }

    if (!req.file) {
      throw new ApiError(400, "PDF file is required");
    }

    const document = await createDocument({
      title,
      type,
      subjectId,
      year,
      pdf: req.file.buffer,
      pdfOriginalName: req.file.originalname,
      uploadedById: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  },
);

export const updateDocumentController = asyncHandler(
  async (req: Request, res: Response) => {
    const documentId = getParamValue(req.params.id, "Document id");

    const title =
      typeof req.body.title === "string" ? req.body.title : undefined;
    const type = typeof req.body.type === "string" ? req.body.type : undefined;
    const subjectId =
      typeof req.body.subjectId === "string" ? req.body.subjectId : undefined;
    const year = typeof req.body.year === "string" ? req.body.year : undefined;

    const document = await updateDocument({
      id: documentId,
      ...(title !== undefined ? { title } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(subjectId !== undefined ? { subjectId } : {}),
      ...(year !== undefined ? { year } : {}),
      ...(req.file ? { pdf: req.file.buffer } : {}),
      ...(req.file ? { pdfOriginalName: req.file.originalname } : {}),
    });

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      data: document,
    });
  },
);

export const deleteDocumentController = asyncHandler(
  async (req: Request, res: Response) => {
    const documentId = getParamValue(req.params.id, "Document id");
    const document = await deleteDocument(documentId);

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      data: document,
    });
  },
);
