import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  forgotPassword,
  resetPassword,
  updateUserProfile,
  getAllUsers,
  logoutUser,
  sendEmailOtp,
  verifyEmailOtp,
} from "../Controllers/userController.js";
import { authMiddleware } from "../Middlewares/authMiddleware.js";
import upload from "../Config/Multer.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getUser/:userId", authMiddleware, getUserProfile);
router.post("/logout", authMiddleware, logoutUser);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword/:id/:token", resetPassword);
router.post(
  "/updateProfile/:userId",
  authMiddleware,
  upload.single("profileImage"),
  updateUserProfile,
);
router.get("/users", authMiddleware, getAllUsers);
router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);

export default router;
