import multer from "multer";

import { ApiError } from "../utils/api-error.js";

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (file.mimetype !== "application/pdf") {
    callback(new ApiError(400, "Only PDF files are allowed"));
    return;
  }

  callback(null, true);
};

export const uploadPdf = multer({
  storage,
  fileFilter,
});
