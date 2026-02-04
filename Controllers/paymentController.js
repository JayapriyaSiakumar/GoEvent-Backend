// Controllers/paymentController.js
import stripe from "../Config/Stripe.js";
import Payment from "../Models/paymentSchema.js";
import Booking from "../Models/bookingSchema.js";
import Event from "../Models/eventSchema.js";
import dotenv from "dotenv";
import sendEmail from "../Utils/mailer.js";

dotenv.config();
export const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId, eventId } = req.body;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId).populate("event");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.bookingStatus === "confirmed") {
      return res.status(400).json({ message: "Booking already confirmed" });
    }

    const amount = booking.totalAmount * 100; // in paise

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "inr",
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: booking._id.toString(),
        userId: userId.toString(),
      },
    });

    const payment = await Payment.create({
      user: userId,
      booking: bookingId,
      event: eventId,
      amount: booking.totalAmount,
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret,
      status: "created",
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: "PaymentIntent ID missing" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    payment.status = "succeeded";
    payment.paidAt = new Date();
    payment.paymentMethod = paymentIntent.payment_method_types?.[0] || "card";

    // ✅ SAFE receipt handling
    if (paymentIntent.latest_charge) {
      const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
      payment.receiptUrl = charge.receipt_url;
    }

    await payment.save();

    await Booking.findByIdAndUpdate(payment.booking, {
      bookingStatus: "confirmed",
      paymentStatus: "paid",
    });

    // 👉 Get booking again (contains ticketType and quantity)
    const booking = await Booking.findById(payment.booking);
    const event = await Event.findById(booking.event);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 1️⃣ Calculate TOTAL SEATS (sum of event.tickets quantities)
    const totalSeats = event.tickets.reduce((sum, t) => sum + t.quantity, 0);

    // 2️⃣ Calculate BOOKED SEATS from confirmed bookings
    const confirmedBookings = await Booking.aggregate([
      { $match: { event: event._id, bookingStatus: "confirmed" } },
      { $group: { _id: null, totalBooked: { $sum: "$quantity" } } },
    ]);

    const bookedSeats =
      confirmedBookings.length > 0 ? confirmedBookings[0].totalBooked : 0;

    // 3️⃣ Check if SOLD-OUT
    if (bookedSeats >= totalSeats) {
      event.status = "sold-out";
      await event.save();
    } /* else {
      if (event.status !== "cancelled" && event.status !== "completed") {
        event.status = "published";
      }
    }
 */
    await sendEmail(
      req.user.email,
      "Booking Confirmed",
      `Your Booking is Confirmed`,
      `<h2>Booking  Confirmed</h2>
        <p>Booking is Confirmed and Check Site for Schedules and updates.</p>
        <a href="${process.env.FRONT_END_URL}">${process.env.FRONT_END_URL}</a>
        `,
    );
    //console.log("Email Sent");

    res.status(200).json({
      message: "Payment successful & booking confirmed and Sent email",
    });
  } catch (error) {
    console.error("CONFIRM PAYMENT ERROR:", error);
    res.status(500).json({
      message: error.message || "Payment confirmation failed",
    });
  }
};

export const getEventPayments = async (req, res) => {
  try {
    const { eventId } = req.params;

    // 1️⃣ Check event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // 2️⃣ Authorization
    // Organizer → only their event
    if (req.user.role === "organizer") {
      if (event.organizer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view payments for this event",
        });
      }
    }

    // Admin can view all

    // 3️⃣ Fetch payments
    const payments = await Payment.find({ event: eventId })
      .populate("user", "name email")
      .populate({
        path: "booking",
        select: "quantity totalAmount ticketType",
      })
      .sort({ createdAt: -1 });

    // 4️⃣ Calculate totals
    const totalRevenue = payments
      .filter((p) => p.status === "succeeded")
      .reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
      },
      totalPayments: payments.length,
      totalRevenue,
      payments,
    });
  } catch (error) {
    console.error("getEventPayments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event payments",
    });
  }
};
