import cron from "node-cron";
import Event from "../Models/eventSchema.js";

export function startEventStatusCron() {
  // Runs every day at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      const now = new Date();

      // Update ongoing events
      await Event.updateMany(
        {
          startDate: { $lte: now },
          endDate: { $gte: now },
          status: { $ne: "ongoing" },
        },
        { $set: { status: "ongoing", updatedAt: new Date() } },
      );

      // Update completed events
      await Event.updateMany(
        {
          endDate: { $lt: now },
          status: { $ne: "completed" },
        },
        { $set: { status: "completed", updatedAt: new Date() } },
      );

      console.log("Daily event status cron ran at:", now.toISOString());
    } catch (error) {
      console.error("Cron error:", error);
    }
  });

  console.log("Event Status Cron Job Initialized");
}
