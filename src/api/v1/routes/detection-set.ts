import express from "express";
import controller from "../controllers/detection-set";
import { s3Upload } from "../../middlewares/s3Middleware";
import { auth } from "../../middlewares/authMiddleware";

const router = express.Router();

router.get("/", auth, controller.getDetectionSets);
router.post("/", auth, s3Upload.array("images"), controller.createDetectionSet);
router.get("/:id", auth, controller.getDetectionSetById);
router.get("/:id/images", auth, controller.getDetectoinSetImages);

export default router;
