import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    enum: [
      "Conference",
      "Workshop",
      "Meetup",
      "Concert",
      "Webinar",
      "Festival",
      "Sports",
      "Other",
    ],
    default: "Other",
  },

  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  startDate: {
    type: Date,
    required: true,
  },

  endDate: {
    type: Date,
    required: true,
  },

  isOnline: {
    type: Boolean,
    default: false,
  },

  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
  },

  onlineLink: {
    type: String,
    default: "",
  },

  bannerImage: {
    type: String,
    default: "",
  },

  tickets: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
      },
      ticketType: {
        type: String, // Regular, VIP, Early Bird
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],

  status: {
    type: String,
    enum: [
      "pending",
      "published",
      "cancelled",
      "completed",
      "sold-out",
      "ongoing",
    ],
    default: "pending",
  },

  isApproved: {
    type: Boolean,
    default: false,
  },

  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Event = mongoose.model("Event", eventSchema);
export default Event;
