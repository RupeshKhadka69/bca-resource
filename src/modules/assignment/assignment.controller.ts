import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler.js";
import { ApiError } from "../../utils/api-error.js";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  getAssignments,
  updateAssignment,
} from "./assignment.service.js";

const getParamValue = (value: string | string[] | undefined, key: string) => {
  if (typeof value !== "string") {
    throw new ApiError(400, `${key} is required`);
  }

  return value;
};

const asOptionalString = (value: unknown, fieldName: string) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a string`);
  }

  return value;
};

const asOptionalStringOrNumber = (value: unknown, fieldName: string) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    throw new ApiError(400, `${fieldName} must be a string or number`);
  }

  return value;
};

export const getAssignmentsController = asyncHandler(
  async (req: Request, res: Response) => {
    const subjectIdQuery = req.query.subjectId;

    if (Array.isArray(subjectIdQuery)) {
      throw new ApiError(400, "subjectId must be a single value");
    }

    const assignments = await getAssignments({
      subjectId: typeof subjectIdQuery === "string" ? subjectIdQuery : undefined,
    });

    res.status(200).json({
      success: true,
      data: assignments,
    });
  },
);

export const getAssignmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const assignmentId = getParamValue(req.params.id, "Assignment id");
    const assignment = await getAssignmentById(assignmentId);

    res.status(200).json({
      success: true,
      data: assignment,
    });
  },
);

export const createAssignmentController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const title = asOptionalString(req.body.title, "title");
    const subjectId = asOptionalString(req.body.subjectId, "subjectId");
    const assignedDate = asOptionalString(req.body.assignedDate, "assignedDate");
    const description = asOptionalString(req.body.description, "description");
    const dueDate = asOptionalString(req.body.dueDate, "dueDate");
    const maxMarks = asOptionalStringOrNumber(req.body.maxMarks, "maxMarks");

    if (!title || !subjectId || !assignedDate) {
      throw new ApiError(400, "title, subjectId and assignedDate are required");
    }

    const assignment = await createAssignment({
      title,
      subjectId,
      assignedDate,
      ...(description !== undefined ? { description } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
      ...(maxMarks !== undefined ? { maxMarks } : {}),
      ...(req.file ? { pdf: req.file.buffer } : {}),
      ...(req.file ? { pdfOriginalName: req.file.originalname } : {}),
      createdById: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: assignment,
    });
  },
);

export const updateAssignmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const assignmentId = getParamValue(req.params.id, "Assignment id");

    const title = asOptionalString(req.body.title, "title");
    const description = asOptionalString(req.body.description, "description");
    const assignedDate = asOptionalString(req.body.assignedDate, "assignedDate");
    const dueDate = asOptionalString(req.body.dueDate, "dueDate");
    const maxMarks = asOptionalStringOrNumber(req.body.maxMarks, "maxMarks");
    const subjectId = asOptionalString(req.body.subjectId, "subjectId");

    if (
      title === undefined &&
      description === undefined &&
      assignedDate === undefined &&
      dueDate === undefined &&
      maxMarks === undefined &&
      subjectId === undefined &&
      !req.file
    ) {
      throw new ApiError(400, "At least one field or pdf is required");
    }

    const assignment = await updateAssignment({
      id: assignmentId,
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(assignedDate !== undefined ? { assignedDate } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
      ...(maxMarks !== undefined ? { maxMarks } : {}),
      ...(subjectId !== undefined ? { subjectId } : {}),
      ...(req.file ? { pdf: req.file.buffer } : {}),
      ...(req.file ? { pdfOriginalName: req.file.originalname } : {}),
    });

    res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      data: assignment,
    });
  },
);

export const deleteAssignmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const assignmentId = getParamValue(req.params.id, "Assignment id");
    const assignment = await deleteAssignment(assignmentId);

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
      data: assignment,
    });
  },
);
