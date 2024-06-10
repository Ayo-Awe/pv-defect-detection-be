import { S3 } from "@aws-sdk/client-s3";

const s3Endpoint = "https://eu-central-1.linodeobjects.com";

export const s3Client = new S3({
  forcePathStyle: false, // Configures to use subdomain/virtual calling format.
  endpoint: s3Endpoint,
  region: "eu-central-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

export const s3Bucket = "pv-detection";
export const bucketUrl = `${s3Bucket}.${s3Endpoint}`;
