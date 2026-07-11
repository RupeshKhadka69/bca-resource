import { PassThrough } from "node:stream";

import { cloudinary } from "../config/cloudinary.js";

export const uploadPdf = async (buffer: Buffer) => {
  return new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "bca-resources/documents",
          resource_type: "raw",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result) {
            reject(new Error("Cloudinary upload returned no result"));
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      const stream = new PassThrough();
      stream.end(buffer);
      stream.pipe(uploadStream);
    },
  );
};

export const deletePdf = async (publicId: string) => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
};
