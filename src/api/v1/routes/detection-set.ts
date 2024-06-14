import express from "express";
import controller from "../controllers/detection-set";
import { s3Upload } from "../../middlewares/s3Middleware";
import { auth } from "../../middlewares/authMiddleware";
import { ErrorWrapper } from "../../../utils/handler";

const router = express.Router();

router.get("/", auth, ErrorWrapper(controller.getDetectionSets));
router.post(
  "/",
  auth,
  s3Upload.array("images"),
  ErrorWrapper(controller.createDetectionSet)
);
router.get("/:id", auth, ErrorWrapper(controller.getDetectionSetById));
router.get("/:id/images", auth, ErrorWrapper(controller.getDetectoinSetImages));

export default router;
