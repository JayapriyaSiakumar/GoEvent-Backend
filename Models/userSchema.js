import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  emailVerified: {
    type: Boolean,
    default: false,
  },

  phone: {
    type: String,
    unique: true,
    sparse: true,
  },

  phoneVerified: {
    type: Boolean,
    default: false,
  },

  profileImage: {
    type: String,
    default: "",
  },
  password: {
    type: String,
    require: true,
  },
  role: {
    type: String,
    enum: ["admin", "organizer", "user"],
    default: "user",
  },
  token: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  location: {
    type: String,
  },
  bio: {
    type: String,
  },
});

const User = mongoose.model("User", userSchema);
export default User;
