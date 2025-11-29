import express from "express";
import { authMiddleware } from "../middleware.ts/auth.middleware.js";
import { isPremiumUserMiddleware } from "../middleware.ts/premium.middleware.js";
import { getTestCase } from "../controller/getTestCase.js";

const router = express.Router();

router.post('/getTestCase', authMiddleware, isPremiumUserMiddleware, getTestCase);

export default router;
