import User from "../Models/userSchema.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(404).json({ message: "Token missing" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //req.user = await User.findById(decoded._id).select("-password");
    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    //console.log("test middleware");

    next();
  } catch (error) {
    res.status(503).json({ message: error.message });
  }
};
