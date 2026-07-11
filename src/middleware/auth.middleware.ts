import type { RequestHandler } from "express";

import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { verifyJwt } from "../utils/jwt.js";
import { UserStatus } from "../../generated/prisma/index.js";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authorizationHeader = req.header("authorization");

    if (!authorizationHeader) {
      throw new ApiError(401, "Authorization header is required");
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new ApiError(401, "Invalid authorization header format");
    }

    const payload = verifyJwt(token, env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        studentId: true,
        username: true,
        name: true,
        role: true,
        status: true,
        mustChangePassword: true,
        batchId: true,
        currentSemesterId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ApiError(403, "Account is not active");
    }

    if (user.role !== payload.role) {
      throw new ApiError(401, "Unauthorized");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
