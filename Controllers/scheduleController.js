// Controllers/scheduleController.js
import mongoose from "mongoose";
import Schedule from "../Models/scheduleSchema.js";
import Event from "../Models/eventSchema.js";
import User from "../Models/userSchema.js";
import sendEmail from "../Utils/mailer.js";
import Booking from "../Models/bookingSchema.js";

const toUtcDate = (time) => {
  const [h, m] = time.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, 0));
};

// Get Schedules by Event id
export const getSchedules = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { eventId } = req.params;

    let filter = {};

    if (eventId) {
      filter.eventId = eventId;

      // Organizer safety check
      if (role === "organizer") {
        const event = await Event.findOne({
          _id: eventId,
          organizer: _id,
        });

        if (!event) {
          return res.status(403).json({
            success: false,
            message: "Not authorized for this event",
          });
        }
      }
    } else if (role === "organizer") {
      const events = await Event.find({ organizer: _id }).select("_id");
      filter.eventId = { $in: events.map((e) => e._id) };
    }

    const schedules = await Schedule.find(filter)
      .populate("eventId", "title")
      .sort({ startTime: 1 });

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

export const createSchedule = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { eventId, title, startTime, endTime, speaker, description } =
      req.body;

    if (role !== "organizer") {
      return res.status(403).json({ message: "Access denied" });
    }

    // 🧪 Validate eventId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    // 🧪 Required fields
    if (!title || !startTime || !endTime || !speaker) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const eventExists = await Event.findOne({
      _id: eventId,
      organizer: _id,
    });

    if (!eventExists) {
      return res.status(403).json({ message: "Invalid event" });
    }

    const schedule = await Schedule.create({
      eventId,
      title,
      startTime: toUtcDate(startTime),
      endTime: toUtcDate(endTime),
      speaker,
      description,
      createdBy: _id,
    });

    res.status(201).json({
      success: true,
      message: "Schedule created successfully",
      data: schedule,
    });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    const { eventId, title, startTime, endTime, speaker, description } =
      req.body;
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    const updateData = {
      eventId,
      title,
      startTime: toUtcDate(startTime),
      endTime: toUtcDate(endTime),
      speaker,
      description,
    };
    Object.assign(schedule, updateData);
    await schedule.save();

    res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      data: schedule,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendScheduleEmailToUsers = async (req, res) => {
  try {
    const { eventId } = req.params;

    // 1 Check event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 2 Get schedules for event
    /*  const schedules = await Schedule.find({ event: eventId });
    console.log(schedules);
    if (!schedules.length) {
      return res.status(400).json({
        message: "No schedules found for this event",
      });
    } */
    const { schedules } = req.body;
    if (!schedules.length) {
      return res.status(400).json({
        message: "No schedules found for this event",
      });
    }

    // 3 Get confirmed + paid bookings
    const bookings = await Booking.find({
      event: eventId,
      bookingStatus: "confirmed",
      paymentStatus: "paid",
    }).populate("user", "email name");

    if (!bookings.length) {
      return res.status(400).json({
        message: "No registered users for this event",
      });
    }

    const groupedByEmail = new Map();

    bookings.forEach((booking) => {
      const email = booking.user?.email;
      if (!email) return;

      if (!groupedByEmail.has(email)) {
        groupedByEmail.set(email, {
          email,
          name: booking.user.name,
        });
      }
    });

    const groupedUsers = Array.from(groupedByEmail.values());

    // 4 Prepare email content
    const scheduleHtml = schedules
      .map(
        (s) => `
          <tr>
            <td>${s.title}</td>
            <td>${new Date(s.startTime).toLocaleString()}</td>
            <td>${new Date(s.endTime).toLocaleString()}</td>
            <td>${s.speaker || "-"}</td>
          </tr>
        `,
      )
      .join("");

    // 5 Send email to each user
    for (const booking of groupedUsers) {
      if (!booking?.email) continue;

      await sendEmail(
        booking.email,
        `📅 Updated Schedule – ${event.title}`,
        `
          <h2>Hello ${booking.name || "Attendee"},</h2>
          <p>The schedule for <strong>${event.title}</strong> has been updated.</p>

          <table border="1" cellpadding="8" cellspacing="0">
            <thead>
              <tr>
                <th>Session</th>
                <th>Start</th>
                <th>End</th>
                <th>Speaker</th>
              </tr>
            </thead>
            <tbody>
              ${scheduleHtml}
            </tbody>
          </table>

          <p>We look forward to seeing you! 🎉</p>
        `,
        `<h2>Hello ${booking.name || "Attendee"},</h2>
          <p>The schedule for <strong>${event.title}</strong> has been updated.</p>

          <table border="1" cellpadding="8" cellspacing="0">
            <thead>
              <tr>
                <th>Session</th>
                <th>Start</th>
                <th>End</th>
                <th>Speaker</th>
              </tr>
            </thead>
            <tbody>
              ${scheduleHtml}
            </tbody>
          </table>

          <p>We look forward to seeing you! 🎉</p>
        `,
      );
    }

    res.status(200).json({
      success: true,
      message: "Schedule email sent to all registered users",
    });
  } catch (error) {
    console.error("Schedule email error:", error);
    res.status(500).json({
      message: "Failed to send schedule emails",
      error: error.message,
    });
  }
};

export const getEventSchedule = async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate("eventId", "title startDate")
      .sort({ startTime: 1 });

    const calendarEvents = schedules.map((sch) => {
      const eventDate = new Date(sch.eventId.startDate);
      const startTime = new Date(sch.startTime);
      const endTime = new Date(sch.endTime);

      // 🔥 combine date + time
      const startDateTime = new Date(eventDate);
      startDateTime.setUTCHours(
        startTime.getUTCHours(),
        startTime.getUTCMinutes(),
        0,
        0,
      );

      const endDateTime = new Date(eventDate);
      endDateTime.setUTCHours(
        endTime.getUTCHours(),
        endTime.getUTCMinutes(),
        0,
        0,
      );

      const startLocal = new Date(
        startDateTime.getTime() + startDateTime.getTimezoneOffset() * 60000,
      );
      const endLocal = new Date(
        endDateTime.getTime() + endDateTime.getTimezoneOffset() * 60000,
      );

      return {
        title: `${sch.title} (${sch.eventId.title})`,
        start: startLocal,
        end: endLocal,
        speaker: sch.speaker,
        description: sch.description,
        eventTitle: sch.eventId.title,
      };
    });

    res.status(200).json(calendarEvents);
  } catch (error) {
    console.error("getEventSchedule error:", error);
    res.status(500).json({
      message: "Failed to load schedules",
      error: error.message,
    });
  }
};
