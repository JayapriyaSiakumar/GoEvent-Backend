import User from "../Models/userSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import sendEmail from "../Utils/mailer.js";
import { generateOtp } from "../Utils/generateOtp.js";
import EmailOtp from "../Models/emailOtpSchema.js";

dotenv.config();

// Register User

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, emailVerified } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1 Email already registered?
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    if (!emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email before registering",
      });
    }

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      emailVerified,
    });
    await newUser.save();
    res
      .status(200)
      .json({ message: "User registered successfully", data: newUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Cannot register user Error in Register ${error}` });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userDetail = await User.findOne({ email });
    if (!userDetail) {
      return res.status(404).json({ message: "Invalid email" });
    }
    const matchPassword = await bcrypt.compare(password, userDetail.password);
    if (!matchPassword) {
      return res.status(404).json({ message: "Invalid Password" });
    }
    //JWT
    const token = await jwt.sign(
      { _id: userDetail._id },
      process.env.JWT_SECRET,
    );
    userDetail.token = token;
    await userDetail.save();

    res.status(200).json({
      message: "User LoggedIn Successfully",
      token: token,
      role: userDetail.role,
      userId: userDetail._id,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Cannot Login user Error in Login ${error}` });
  }
};

//Logout User
export const logoutUser = async (req, res) => {
  try {
    const { userId } = req.body;
    //console.log("Logout UserId:", userId);
    const userDetail = await User.findById(userId);
    if (!userDetail) {
      return res.status(404).json({ message: "User not found" });
    }
    userDetail.token = null;
    await userDetail.save();
    res
      .status(200)
      .json({ message: "User LoggedOut Successfully", data: userDetail });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Cannot Logout user Error in Logout ${error}` });
  }
};

// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const userDetail = await User.findById(userId);
    if (!userDetail) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User Profile", data: userDetail });
  } catch (error) {
    res.status(500).json({
      message: `Cannot get user profile Error in Get Profile ${error}`,
    });
  }
};

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ message: "Users", data: users });
  } catch (error) {
    res.status(500).json({
      message: `Cannot get all users Error in Get All Users ${error}`,
    });
  }
};

// Update User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    let imageUrl = "";
    //if file uploaded then upload to cloudinary
    if (req.file && req.file.path) {
      imageUrl = req.file.path;
    }
    const updates = { ...req.body, profileImage: imageUrl };
    const userDetail = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    });
    if (!userDetail) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User Profile Updated", data: userDetail });
  } catch (error) {
    res.status(500).json({
      message: `Cannot update user profile Error in Update Profile ${error}`,
    });
  }
};

// Delete User Profile
export const deleteUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const userDetail = await User.findByIdAndDelete(userId);
    if (!userDetail) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User Profile Deleted", data: userDetail });
  } catch (error) {
    res.status(500).json({
      message: `Cannot delete user profile Error in Delete Profile ${error}`,
    });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const userDetail = await User.findOne({ email });
    if (!userDetail) {
      return res.status(404).json({ message: "Invalid email" });
    }

    const token = jwt.sign({ _id: userDetail._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    //send email
    await sendEmail(
      userDetail.email,
      "Password Reset link",
      `You are receiving this email because you have requested to reset your password.
       Please click the following link to reset your password: https://go-event-ruddy.vercel.app/reset-password/${userDetail._id}/${token}
       If you did not request this, please ignore this email.`,
      `<h3>You are receiving this email because you have requested to reset your password.</h3><br/>
       Please click the following link to reset your password: <b>https://go-event-ruddy.vercel.app/reset-password/${userDetail._id}/${token}</b>
       If you did not request this, please ignore this email.`,
    );
    //console.log("Email Sent Successfully");
    res.status(200).json({
      message: "Email Sent Successfully. Check email for Reset Password Link",
    });
  } catch (error) {
    res.status(500).json({
      message: `Cannot give forgot password, Error in forgot password - ${error}`,
    });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { id, token } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid Token" });
    }
    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true },
    );
    res
      .status(200)
      .json({ message: "Password updated Successfully", data: updatedUser });
  } catch (error) {
    res.status(500).json({
      message: `Cannot reset password, Error in reset password - ${error}`,
    });
  }
};

export const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = generateOtp();

    // remove old OTPs for same email
    await EmailOtp.deleteMany({ email });

    await EmailOtp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendEmail(
      email,
      "Email Verification OTP",
      `Your OTP is ${otp} Valid for 10 minutes`,
      `<h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Valid for 10 minutes.</p>`,
    );
    //console.log("Email Sent");

    res.status(200).json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    const record = await EmailOtp.findOne({ email, otp });

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (record.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // cleanup
    await EmailOtp.deleteMany({ email });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

export const isEmailVerified = (req, res) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      message: "Please verify your email",
    });
  }
};
