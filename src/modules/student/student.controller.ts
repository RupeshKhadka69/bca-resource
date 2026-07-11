import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler.js";
import {
  createStudentSchema,
  paginationQuerySchema,
  resetStudentPasswordSchema,
  studentParamsSchema,
  updateStudentSchema,
} from "./student.schema.js";
import {
  createStudent,
  deactivateStudent,
  getStudentById,
  listStudents,
  resetStudentPassword,
  updateStudent,
} from "./student.service.js";

export const createStudentController = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = createStudentSchema.parse(req.body);
    const student = await createStudent(payload);

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  },
);

export const listStudentsController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = paginationQuerySchema.parse(req.query);
    const result = await listStudents(query);

    res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      data: result.students,
      pagination: result.pagination,
    });
  },
);

export const getStudentController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = studentParamsSchema.parse(req.params);
    const student = await getStudentById(params.id);

    res.status(200).json({
      success: true,
      message: "Student fetched successfully",
      data: student,
    });
  },
);

export const updateStudentController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = studentParamsSchema.parse(req.params);
    const payload = updateStudentSchema.parse(req.body);
    const student = await updateStudent(params.id, payload);

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  },
);

export const deleteStudentController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = studentParamsSchema.parse(req.params);
    const student = await deactivateStudent(params.id);

    res.status(200).json({
      success: true,
      message: "Student deactivated successfully",
      data: student,
    });
  },
);

export const resetStudentPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = studentParamsSchema.parse(req.params);
    const payload = resetStudentPasswordSchema.parse(req.body);
    const student = await resetStudentPassword(params.id, payload);

    res.status(200).json({
      success: true,
      message: "Student password reset successfully",
      data: student,
    });
  },
);
