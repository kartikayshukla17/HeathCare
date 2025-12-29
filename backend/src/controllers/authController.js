import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const { sign, verify } = jwt;
const { hash, compare } = bcrypt;
import { config } from "dotenv";
import Patient from "../models/Patient.js";
import Admin from "../models/Admin.js";
import Doctor from "../models/Doctor.js";
import sendMail from "./mailController.js";
import cookieParser from "cookie-parser";

config();

const authController = express();
authController.use(cookieParser());

const generateToken = (user, role) => {
  return sign(
    { id: user._id, email: user.email, role: role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};

// Register - Primarily for Patients and Admins (Doctors usually added by Admin)
authController.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, gender, DOB, address } = req.body;

    // Default to patient if no role provided, or strictly check
    const userRole = role || "patient";

    let existingUser;
    let newUser;

    if (userRole === "patient") {
      existingUser = await Patient.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "Patient already exists" });

      const hashedPassword = await hash(password, 10);
      newUser = new Patient({
        name,
        email,
        password: hashedPassword,
        role: "patient",
        gender,
        DOB,
        address,
      });
    } else if (userRole === "admin") {
      existingUser = await Admin.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "Admin already exists" });

      const hashedPassword = await hash(password, 10);
      newUser = new Admin({
        name,
        email,
        password: hashedPassword,
        role: "admin",
      });
    } else {
      return res.status(400).json({ message: "Invalid role for registration. Doctors should be added by Admin." });
    }

    const savedUser = await newUser.save();

    res.status(201).json({ message: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} registered successfully` });

    // Send email (fire and forget to avoid blocking)
    const mailOptions = {
      to: email,
      subject: "Registration Notification",
      text: `Hello ${name},\n\nYou have successfully registered as a ${userRole}.\n\nBest regards,\nMediCare+ Team`,
    };
    sendMail(mailOptions).catch(err => console.error("Error sending email:", err));

  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error during registration", error: error.message });
  }
});

// Login - Requires role to know where to look
authController.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Role is required for login (patient, admin, doctor)" });
    }

    let user;
    if (role === "patient") {
      user = await Patient.findOne({ email });
    } else if (role === "admin") {
      user = await Admin.findOne({ email });
    } else if (role === "doctor") {
      user = await Doctor.findOne({ email });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user, role);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      message: "Login successful",
      token, // Return token for frontend usage if needed (e.g. storage)
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || role, // Doctor model doesn't have role field implicit, so use passed role
      },
    });

  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error during login" });
  }
});

authController.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
});

// Get Profile
authController.get("/profile", async (req, res) => {
  try {
    const token = req.cookies.token || (req.headers["authorization"] && req.headers["authorization"].split(" ")[1]);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const { id, role } = decoded;

    let user;
    if (role === "patient") {
      user = await Patient.findById(id);
    } else if (role === "admin") {
      user = await Admin.findById(id);
    } else if (role === "doctor") {
      user = await Doctor.findById(id);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return safe user data
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json(userData);

  } catch (error) {
    console.error("Error fetching profile:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized: Token expired" });
    }
    res.status(500).json({ message: "Internal server error fetching profile" });
  }
});

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token || (req.headers["authorization"] && req.headers["authorization"].split(" ")[1]);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden: Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

export default authController;
