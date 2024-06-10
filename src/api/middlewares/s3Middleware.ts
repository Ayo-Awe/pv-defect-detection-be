import multer from "multer";
import multerS3 from "multer-s3";
import { s3Bucket, s3Client } from "../../s3/config";
import cuid from "cuid";

export const s3Upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: s3Bucket,
    acl: "public-read",
    key(req, file, callback) {
      const newKey = `${cuid()}-${file.originalname}`;
      callback(null, newKey);
    },
  }),
  fileFilter(req, file, callback) {
    const acceptFile = ["image/png", "image/jpeg"].includes(file.mimetype);
    callback(null, acceptFile);
  },
});
