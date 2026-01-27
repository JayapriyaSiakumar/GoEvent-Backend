// Routes/scheduleRoutes.js
import express from "express";
import { authMiddleware } from "../Middlewares/authMiddleware.js";
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  sendScheduleEmailToUsers,
  getEventSchedule,
} from "../Controllers/scheduleController.js";

const router = express.Router();

router.get("/all/:eventId", authMiddleware, getSchedules);
router.post("/create", authMiddleware, createSchedule);
router.put("/update/:id", authMiddleware, updateSchedule);
router.delete("/delete/:id", authMiddleware, deleteSchedule);
router.post(
  "/notify-schedule/:eventId",
  authMiddleware,
  sendScheduleEmailToUsers,
);
router.get("/all-event-schedules/", authMiddleware, getEventSchedule);

export default router;
