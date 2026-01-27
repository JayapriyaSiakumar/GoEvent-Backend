import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // Who made the payment
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Which booking this payment is for
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    // Which booking this payment is for
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    // Amount in base currency (INR)
    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "inr",
    },

    // Card / Wallet / UPI etc (captured from Stripe)
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet"],
      default: "card",
    },

    paymentGateway: {
      type: String,
      default: "stripe",
    },

    // Stripe identifiers
    stripePaymentIntentId: {
      type: String,
      required: true,
      index: true,
    },

    stripeClientSecret: {
      type: String,
    },

    // Payment lifecycle
    status: {
      type: String,
      enum: ["created", "succeeded", "failed", "refunded"],
      default: "created",
    },

    // Stripe receipt URL
    receiptUrl: {
      type: String,
    },

    // Payment completion time
    paidAt: {
      type: Date,
    },

    // Optional refund tracking
    refundedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// One payment per booking (recommended)
paymentSchema.index({ booking: 1 }, { unique: true });

export default mongoose.model("Payment", paymentSchema);
