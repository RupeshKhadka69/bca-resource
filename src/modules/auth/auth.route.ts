import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  changePasswordController,
  loginController,
  meController,
} from "./auth.controller.js";

const router = Router();

router.post("/login", loginController);
router.post("/change-password", requireAuth, changePasswordController);
router.get("/me", requireAuth, meController);

export default router;
