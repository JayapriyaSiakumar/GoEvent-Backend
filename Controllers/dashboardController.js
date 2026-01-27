import Event from "../Models/eventSchema.js";
import Booking from "../Models/bookingSchema.js";

export const getDashboardStats = async (req, res) => {
  try {
    const { role, _id } = req.user;

    // EVENT FILTER
    const eventFilter =
      role === "organizer" ? { organizer: _id } : {};

    // GET EVENTS
    const events = await Event.find(eventFilter).select("_id");

    const eventIds = events.map(
      (e) => new mongoose.Types.ObjectId(e._id)
    );

    // BOOKING FILTER
    const bookingFilter =
      role === "organizer"
        ? {
            event: { $in: eventIds },
            paymentStatus: "paid",
          }
        : { paymentStatus: "paid" };

    // TOTAL EVENTS
    const totalEvents =
      role === "organizer"
        ? eventIds.length
        : await Event.countDocuments();

    // TOTAL REGISTRATIONS
    const totalRegistrations =
      await Booking.countDocuments(bookingFilter);

    // TOTAL ATTENDEES
    const attendeesAgg = await Booking.aggregate([
      { $match: bookingFilter },
      {
        $group: {
          _id: null,
          totalAttendees: {
            $sum: { $ifNull: ["$tickets", 0] },
          },
        },
      },
    ]);

    const totalAttendees = attendeesAgg[0]?.totalAttendees || 0;

    // TOTAL REVENUE
    const revenueAgg = await Booking.aggregate([
      { $match: bookingFilter },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $ifNull: ["$totalAmount", 0] },
          },
        },
      },
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      role,
      data: {
        totalEvents,
        totalRegistrations,
        totalAttendees,
        totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPaymentChart = async (req, res) => {
  try {
    const { role, _id } = req.user;

    let matchStage = {};

    if (role === "organizer") {
      const events = await Event.find({ organizer: _id }).select("_id");
      const eventIds = events.map((e) => e._id);

      matchStage = { event: { $in: eventIds } };
    }

    const stats = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            status: "$paymentStatus",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const months = [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formatted = {};

    stats.forEach((item) => {
      const month = months[item._id.month];

      if (!formatted[month]) {
        formatted[month] = {
          month,
          paid: 0,
          pending: 0,
          refunded: 0,
        };
      }

      formatted[month][item._id.status] = item.count;
    });

    res.status(200).json({
      success: true,
      data: Object.values(formatted),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRevenueChart = async (req, res) => {
  try {
    const { role, _id } = req.user;

    let matchStage = { paymentStatus: "paid" };

    if (role === "organizer") {
      const events = await Event.find({ organizer: _id }).select("_id");
      const eventIds = events.map((e) => e._id);

      matchStage.event = { $in: eventIds };
    }

    const revenueStats = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$amountPaid" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formattedData = revenueStats.map((item) => ({
      month: months[item._id],
      revenue: item.revenue,
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPayments = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    let filter = {};

    // 🔹 Organizer → only their event payments
    if (role === "organizer") {
      const events = await Event.find({ organizer: _id }).select("_id");
      const eventIds = events.map((e) => e._id);

      filter.event = { $in: eventIds };
    }

    // 🔹 Status filter
    if (status) {
      filter.paymentStatus = status;
    }

    const payments = await Booking.find(filter)
      .populate("user", "name email")
      .populate("event", "title")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      role,
      data: payments,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
