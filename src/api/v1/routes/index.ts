import express from "express";

import controller from "../controllers";
import authRouter from "../routes/auth";

const router = express.Router();

// Welcome endpoint
router.get("/", controller.welcomeHandler);
router.use("/auth", authRouter);

export default router;
