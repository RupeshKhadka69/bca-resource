import { Role } from "@prisma/client";
import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  createSubjectController,
  deleteSubjectController,
  getSubjectController,
  getSubjectsController,
  updateSubjectController,
} from "./subject.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getSubjectsController);
router.get("/:id", getSubjectController);

router.post("/", requireRole(Role.ADMIN), createSubjectController);
router.patch("/:id", requireRole(Role.ADMIN), updateSubjectController);
router.delete("/:id", requireRole(Role.ADMIN), deleteSubjectController);

export default router;
