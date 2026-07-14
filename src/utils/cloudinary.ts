import { cloudinary } from "../config/cloudinary.js";

export const uploadPdf = async (
  buffer: Buffer,
  originalName: string,
) => {
  return new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const safeName = originalName
        .replace(/\.pdf$/i, "")
        .replace(/[^a-zA-Z0-9_-]/g, "-");

      const publicId = `${safeName}-${Date.now()}.pdf`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "bca-resources/documents",
          resource_type: "raw",
          public_id: publicId,
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

      uploadStream.end(buffer);
    },
  );
};

export const deletePdf = async (publicId: string) => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
};