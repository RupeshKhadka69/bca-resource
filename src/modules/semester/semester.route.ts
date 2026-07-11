import { Role } from "../../../generated/prisma/index.js";
import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  createSemesterController,
  deleteSemesterController,
  getSemesterController,
  getSemestersController,
  getSubjectsBySemesterController,
  updateSemesterController,
} from "./semester.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getSemestersController);
router.get("/:semesterId/subjects", getSubjectsBySemesterController);
router.get("/:id", getSemesterController);

router.post("/", requireRole(Role.ADMIN), createSemesterController);
router.patch("/:id", requireRole(Role.ADMIN), updateSemesterController);
router.delete("/:id", requireRole(Role.ADMIN), deleteSemesterController);

export default router;
