import express from "express";
import cors from "cors";

import { ApiError } from "./utils/api-error.js";
import authRoutes from "./modules/auth/auth.route.js";
import documentRoutes from "./modules/document/document.route.js";
import studentRoutes from "./modules/student/student.route.js";
import semesterRoutes from "./modules/semester/semester.route.js";
import subjectRoutes from "./modules/subject/subject.route.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "BCA Resource API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin/students", studentRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/documents", documentRoutes);

app.use((_req, _res, next) => {
  next(new ApiError(404, "Route not found"));
});

app.use(errorMiddleware);

export default app;
