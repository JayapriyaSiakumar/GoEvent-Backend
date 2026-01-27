import mongoose from "mongoose";

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },

    otp: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // 🔥 TTL
    },
  },
  { timestamps: true },
);

const EmailOtp = mongoose.model("EmailOtp", emailOtpSchema);
export default EmailOtp;
