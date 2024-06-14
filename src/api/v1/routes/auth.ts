import express from "express";
import controller from "../controllers/auth";
import { ErrorWrapper } from "../../../utils/handler";

const router = express.Router();

router.post("/signup", ErrorWrapper(controller.signup));
router.post("/login", ErrorWrapper(controller.login));

export default router;
