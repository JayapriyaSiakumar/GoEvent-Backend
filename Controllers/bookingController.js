import Booking from "../Models/bookingSchema.js";
import Event from "../Models/eventSchema.js";
import Payment from "../Models/paymentSchema.js";
import stripe from "../Config/Stripe.js";
import sendEmail from "../Utils/mailer.js";

//check availability
export const checkAvailability = async (req, res) => {
  try {
    const { eventId, quantity } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.availableTickets < quantity) {
      return res.status(400).json({
        message: "Not enough tickets available",
      });
    }

    res.status(200).json({
      available: true,
      remainingTickets: event.availableTickets,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//create booking
export const createBooking = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId, quantity, ticketId } = req.body;

    if (!req.user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.availableTickets < quantity) {
      return res.status(400).json({ message: "Tickets sold out" });
    }

    const price = event.tickets.find(
      (ticket) => ticket._id.toString() === ticketId,
    ).price;
    const ticketType = event.tickets.find(
      (ticket) => ticket._id.toString() === ticketId,
    ).ticketType;

    const totalAmount = price * quantity;

    const booking = await Booking.create({
      user: userId,
      event: eventId,
      quantity,
      ticketType,
      pricePerTicket: price,
      totalAmount,
      bookingStatus: "pending",
      paymentStatus: "pending",
    });

    res.status(201).json({
      message: "Booking created successfully With Payment Status pending",
      booking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// USER – My Bookings
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("event", "title startDate endDate location tickets bannerImage")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* // USER – Cancel Booking
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    booking.bookingStatus = "cancelled";
    booking.paymentStatus = "refunded";

    await booking.save();
    res.json({ message: "Booking cancelled & refunded" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 */
export const cancelBookingAndRefund = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // 1 Find booking
    const booking = await Booking.findById(bookingId).populate("event");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 2 Authorization check
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 3 Already cancelled?
    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking already cancelled",
      });
    }

    // 4 Find payment USING bookingId (🔥 KEY FIX)
    const payment = await Payment.findOne({ booking: booking._id });

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: "Payment record missing for this booking",
      });
    }

    // 5 Already refunded?
    if (booking.paymentStatus === "refunded") {
      return res.status(400).json({
        success: false,
        message: "Payment already refunded",
      });
    }

    // 6 Stripe refund
    if (!payment.stripePaymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Stripe payment reference missing",
      });
    }

    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
    });

    // 7 Update payment
    payment.status = "refunded";
    await payment.save();

    // 8 Update booking
    booking.bookingStatus = "cancelled";
    booking.paymentStatus = "refunded";
    await booking.save();

    // 9 Restore event tickets
    if (booking.event && booking.quantity) {
      await Event.findByIdAndUpdate(booking.event._id, {
        $inc: { availableTickets: booking.quantity },
      });
    }

    await sendEmail(
      req.user.email,
      "Booking Cancel",
      `Your Booking is Cancelled`,
      `<h2>Booking  Cancelled</h2>
        <p>Booking cancelled and refund processed successfully</p>
        `,
    );

    return res.status(200).json({
      success: true,
      message:
        "Booking cancelled and refund processed successfully and Sent Email",
      refundId: refund.id,
    });
  } catch (error) {
    //console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
