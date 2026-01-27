import express from "express";
import { authMiddleware } from "../Middlewares/authMiddleware.js";
import {
  getDashboardStats,
  getPaymentChart,
  getPayments,
  getRevenueChart,
} from "../Controllers/dashboardController.js";

const router = express.Router();

router.get("/stats", authMiddleware, getDashboardStats);
router.get("/payments-chart", authMiddleware, getPaymentChart);
router.get("/revenue-chart", authMiddleware, getRevenueChart);
router.get("/payments", authMiddleware, getPayments);

export default router;
