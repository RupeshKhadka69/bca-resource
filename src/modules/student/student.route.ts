import { Role } from "../../../generated/prisma/index.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { Router } from "express";

import {
  createStudentController,
  deleteStudentController,
  getStudentController,
  listStudentsController,
  resetStudentPasswordController,
  updateStudentController,
} from "./student.controller.js";

const router = Router();

router.use(requireAuth, requireRole(Role.ADMIN));

router.post("/", createStudentController);
router.get("/", listStudentsController);
router.get("/:id", getStudentController);
router.patch("/:id", updateStudentController);
router.delete("/:id", deleteStudentController);
router.post("/:id/reset-password", resetStudentPasswordController);

export default router;
