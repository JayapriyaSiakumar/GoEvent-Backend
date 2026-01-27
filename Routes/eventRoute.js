import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  getMyEvents,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  getEventAttendees,
  getAllPublishedEvents,
  getEventWithAvailability,
} from "../Controllers/eventController.js";

import { authMiddleware } from "../Middlewares/authMiddleware.js";
import upload from "../Config/Multer.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  upload.single("bannerImage"),
  createEvent,
);
router.get("/all-events", getAllEvents);
router.get("/all-published-events", getAllPublishedEvents);
router.get("/my-events", authMiddleware, getMyEvents);
/* router.get("/getEvent/:id", getEventById); */
router.get("/getEvent/:id", getEventWithAvailability);
router.put(
  "/update/:id",
  authMiddleware,
  upload.single("bannerImage"),
  updateEvent,
);
router.delete("/delete/:id", authMiddleware, deleteEvent);
router.patch("/status/:id/", authMiddleware, updateEventStatus);
router.get("/:eventId/attendees", authMiddleware, getEventAttendees);

export default router;
