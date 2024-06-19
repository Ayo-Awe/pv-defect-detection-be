import multer from "multer";
import multerS3 from "multer-s3";
import { s3Bucket, s3Client } from "../../s3/config";
import cuid from "cuid";
import { BadRequest } from "../../errors/httpErrors";

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

    if (acceptFile) {
      callback(null, acceptFile);
    } else {
      callback(
        new BadRequest(
          "invalid file type, please provide one of png or jpeg",
          "INVALID_REQUEST_PARAMETERS"
        )
      );
    }
  },
});
