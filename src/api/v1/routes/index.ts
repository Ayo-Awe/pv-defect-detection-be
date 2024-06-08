import express from "express";

import controller from "../controllers";

const router = express.Router();

// Welcome endpoint
router.get("/", controller.welcomeHandler);

export default router;
