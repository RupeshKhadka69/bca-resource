import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/api-error.js";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: error.issues[0]?.message ?? "Validation failed",
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Duplicate value violates a unique constraint",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }
  }

  const message =
    error instanceof Error ? error.message : "Internal server error";

  return res.status(500).json({
    success: false,
    message,
  });
};
