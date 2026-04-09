import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER ?? "checkin-media";

export async function uploadImageBuffer(
  buffer: Buffer,
  publicIdHint: string
): Promise<{ publicId: string; secureUrl: string; bytes: number }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: CLOUDINARY_FOLDER,
        public_id: publicIdHint,
        overwrite: false,
        eager: [
          {
            transformation: [
              { crop: "limit", width: 2400, height: 2400 },
              { quality: "auto:best", fetch_format: "webp" },
            ],
          },
        ],
        eager_async: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        const eager = result.eager?.[0];
        resolve({
          publicId: result.public_id,
          secureUrl: eager?.secure_url ?? result.secure_url,
          bytes: eager?.bytes ?? result.bytes,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
