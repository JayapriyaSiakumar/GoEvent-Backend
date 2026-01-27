import express from "express";
import {
  checkAvailability,
  createBooking,
  getMyBookings,
  cancelBookingAndRefund,
} from "../Controllers/bookingController.js";
import { authMiddleware } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.post("/check-availability", checkAvailability);
router.post("/create", authMiddleware, createBooking);
router.get("/my-bookings", authMiddleware, getMyBookings);
//router.put("/cancel-booking/:id", authMiddleware, cancelBooking);
router.put("/cancel/:bookingId", authMiddleware, cancelBookingAndRefund);

export default router;
