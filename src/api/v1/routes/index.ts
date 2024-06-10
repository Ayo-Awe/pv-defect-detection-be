import express from "express";

import controller from "../controllers";
import authRouter from "./auth";
import detectionSetRouter from "./detection-set";

const router = express.Router();

// Welcome endpoint
router.get("/", controller.welcomeHandler);
router.use("/auth", authRouter);
router.use("/detection-sets", detectionSetRouter);

export default router;
