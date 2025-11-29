import express from "express";
import {
  getCurrentUser,
  updateUserDetails,
} from "../controller/userController.js";
import { authMiddleware } from "../middleware.ts/auth.middleware.js";
import { upload } from "../middleware.ts/multer.middleware.js";

const router = express.Router();

router.get("/getCurrentUser", authMiddleware, getCurrentUser);
router.put(
  "/updateUserDetails",
  authMiddleware,
  upload.single("picture"),
  updateUserDetails
);

export default router;
