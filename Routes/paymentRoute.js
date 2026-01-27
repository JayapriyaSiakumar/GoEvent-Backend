import express from "express";
import {
  confirmPayment,
  createPaymentIntent,
  getEventPayments,
} from "../Controllers/paymentController.js";
import { authMiddleware } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create-intent", authMiddleware, createPaymentIntent);
router.post("/confirm", authMiddleware, confirmPayment);
router.get("/event-payment/:eventId", authMiddleware, getEventPayments);

export default router;
