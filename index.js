import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./Database/dbConfig.js";
import userRoute from "./Routes/userRoute.js";
import eventRoute from "./Routes/eventRoute.js";
import bookingRoute from "./Routes/bookingRoute.js";
import paymentRoute from "./Routes/paymentRoute.js";
import dashboardRoute from "./Routes/dashboardRoute.js";
import scheduleRoute from "./Routes/scheduleRoute.js";
import { startEventStatusCron } from "./Utils/cronUpdateEventStatus.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

connectDB();

// Cron Job to update event status every day at midnight
startEventStatusCron();

// default route
app.get("/", (req, res) => {
  res
    .status(200)
    .send("<h1 style='text-align:center;'>Welcome to Go-Event Backend</h1>");
});

// custom Route
app.use("/api/auth", userRoute);
app.use("/api/event", eventRoute);
app.use("/api/bookings", bookingRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/schedule", scheduleRoute);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server started at port ", port);
});
