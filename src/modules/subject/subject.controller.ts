import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler.js";
import { ApiError } from "../../utils/api-error.js";
import {
  createSubject,
  deleteSubject,
  getSubjectById,
  getSubjects,
  updateSubject,
} from "./subject.service.js";

const getParamValue = (value: string | string[] | undefined, key: string) => {
  if (typeof value !== "string") {
    throw new ApiError(400, `${key} is required`);
  }

  return value;
};

export const getSubjectsController = asyncHandler(
  async (req: Request, res: Response) => {
    const semesterIdQuery = req.query.semesterId;

    if (Array.isArray(semesterIdQuery)) {
      throw new ApiError(400, "semesterId must be a single value");
    }

    const subjects = await getSubjects(
      typeof semesterIdQuery === "string" ? semesterIdQuery : undefined,
    );

    res.status(200).json({
      success: true,
      data: subjects,
    });
  },
);

export const getSubjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const subjectId = getParamValue(req.params.id, "Subject id");
    const subject = await getSubjectById(subjectId);

    res.status(200).json({
      success: true,
      data: subject,
    });
  },
);

export const createSubjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, code, semesterId } = req.body as {
      name?: unknown;
      code?: unknown;
      semesterId?: unknown;
    };

    if (
      typeof name !== "string" ||
      typeof code !== "string" ||
      typeof semesterId !== "string"
    ) {
      throw new ApiError(400, "name, code and semesterId are required");
    }

    const subject = await createSubject(name, code, semesterId);

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  },
);

export const updateSubjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, code, semesterId } = req.body as {
      name?: unknown;
      code?: unknown;
      semesterId?: unknown;
    };

    if (name === undefined && code === undefined && semesterId === undefined) {
      throw new ApiError(400, "At least one field is required");
    }

    if (name !== undefined && typeof name !== "string") {
      throw new ApiError(400, "name must be a string");
    }

    if (code !== undefined && typeof code !== "string") {
      throw new ApiError(400, "code must be a string");
    }

    if (semesterId !== undefined && typeof semesterId !== "string") {
      throw new ApiError(400, "semesterId must be a string");
    }

    const subjectId = getParamValue(req.params.id, "Subject id");

    const subject = await updateSubject(subjectId, {
      ...(typeof name === "string" ? { name } : {}),
      ...(typeof code === "string" ? { code } : {}),
      ...(typeof semesterId === "string" ? { semesterId } : {}),
    });

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: subject,
    });
  },
);

export const deleteSubjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const subjectId = getParamValue(req.params.id, "Subject id");
    const subject = await deleteSubject(subjectId);

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
      data: subject,
    });
  },
);
