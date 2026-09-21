import multer from "multer";

import { ApiError } from "../utils/api-error.js";

const storage = multer.memoryStorage();
export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (file.mimetype !== "application/pdf") {
    callback(new ApiError(400, "Only PDF files are allowed"));
    return;
  }

  callback(null, true);
};

const createPdfUploader = (limits?: multer.Options["limits"]) =>
  multer({
    storage,
    fileFilter,
    ...(limits ? { limits } : {}),
  });

export const uploadPdf = createPdfUploader();

export const uploadPdfWithLimit = createPdfUploader({
  fileSize: MAX_PDF_SIZE_BYTES,
});
