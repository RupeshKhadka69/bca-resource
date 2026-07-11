import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler.js";
import { ApiError } from "../../utils/api-error.js";
import {
  createSemester,
  deleteSemester,
  getSemesterById,
  getSemesters,
  updateSemester,
} from "./semester.service.js";
import { getSubjectsBySemesterId } from "../subject/subject.service.js";

const getParamValue = (value: string | string[] | undefined, key: string) => {
  if (typeof value !== "string") {
    throw new ApiError(400, `${key} is required`);
  }

  return value;
};

export const getSemestersController = asyncHandler(
  async (_req: Request, res: Response) => {
    const semesters = await getSemesters();

    res.status(200).json({
      success: true,
      data: semesters,
    });
  },
);

export const getSemesterController = asyncHandler(
  async (req: Request, res: Response) => {
    const semesterId = getParamValue(req.params.id, "Semester id");
    const semester = await getSemesterById(semesterId);

    res.status(200).json({
      success: true,
      data: semester,
    });
  },
);

export const getSubjectsBySemesterController = asyncHandler(
  async (req: Request, res: Response) => {
    const semesterId = getParamValue(req.params.semesterId, "Semester id");
    const subjects = await getSubjectsBySemesterId(semesterId);

    res.status(200).json({
      success: true,
      data: subjects,
    });
  },
);

export const createSemesterController = asyncHandler(
  async (req: Request, res: Response) => {
    const { number, name } = req.body as { number?: unknown; name?: unknown };

    if (typeof number !== "number" || typeof name !== "string") {
      throw new ApiError(400, "number and name are required");
    }

    const semester = await createSemester(number, name);

    res.status(201).json({
      success: true,
      message: "Semester created successfully",
      data: semester,
    });
  },
);

export const updateSemesterController = asyncHandler(
  async (req: Request, res: Response) => {
    const { number, name } = req.body as { number?: unknown; name?: unknown };

    if (number === undefined && name === undefined) {
      throw new ApiError(400, "At least one field is required");
    }

    if (number !== undefined && typeof number !== "number") {
      throw new ApiError(400, "number must be a number");
    }

    if (name !== undefined && typeof name !== "string") {
      throw new ApiError(400, "name must be a string");
    }

    const semesterId = getParamValue(req.params.id, "Semester id");

    const semester = await updateSemester(semesterId, {
      ...(number !== undefined ? { number } : {}),
      ...(name !== undefined ? { name } : {}),
    });

    res.status(200).json({
      success: true,
      message: "Semester updated successfully",
      data: semester,
    });
  },
);

export const deleteSemesterController = asyncHandler(
  async (req: Request, res: Response) => {
    const semesterId = getParamValue(req.params.id, "Semester id");
    const semester = await deleteSemester(semesterId);

    res.status(200).json({
      success: true,
      message: "Semester deleted successfully",
      data: semester,
    });
  },
);
