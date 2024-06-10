ALTER TABLE "detections" ADD COLUMN "total_predicted_images" integer DEFAULT 0 NOT NULL;
ALTER TABLE "detections" DROP COLUMN IF EXISTS "progress";