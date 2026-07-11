import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler.js";
import { ApiError } from "../../utils/api-error.js";
import { changePasswordSchema, loginSchema } from "./auth.schema.js";
import { changePassword, getCurrentUser, login } from "./auth.service.js";

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);
    const result = await login(payload);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  },
);

export const changePasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const payload = changePasswordSchema.parse(req.body);
    const user = await changePassword(req.user.id, payload);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: user,
    });
  },
);

export const meController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const user = await getCurrentUser(req.user.id);

    res.status(200).json({
      success: true,
      message: "Current user fetched successfully",
      data: user,
    });
  },
);
