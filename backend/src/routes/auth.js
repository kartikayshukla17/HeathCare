import express from "express";
import jwt from "jsonwebtoken";
const { sign } = jwt;
import bcrypt from "bcryptjs";
const { hash, compare } = bcrypt;
import { config } from "dotenv";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Specialization from "../models/Specialization.js";
import sendMail from "../controllers/mailController.js";

config();

const router = express.Router();

const generateToken = (user, role) => {
    return sign(
        { id: user._id, email: user.email, role: role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
};

// Register
router.post("/register", async (req, res, next) => {
    try {
        const { name, email, password, role, gender, DOB, address } = req.body;

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
        } else if (userRole === "doctor") {
            existingUser = await Doctor.findOne({ email });
            if (existingUser) return res.status(400).json({ message: "Doctor already exists" });

            const hashedPassword = await hash(password, 10);

            // Ensure gender and specialization are passed
            const specName = req.body.specialization;
            let specId;

            if (specName) {
                // Check if specialization exists, if not create it
                let existingSpec = await Specialization.findOne({ name: specName });
                if (!existingSpec) {
                    existingSpec = await Specialization.create({ name: specName, description: `Specialists in ${specName}` });
                }
                specId = existingSpec._id;
            }

            newUser = new Doctor({
                name,
                email,
                password: hashedPassword,
                role: "doctor",
                gender: req.body.gender, // Ensure this is handled
                specialization: specId,
                image: req.body.image || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80", // Default or required
                availability: req.body.availability || []
            });
        } else {
            return res.status(400).json({ message: "Invalid role for registration." });
        }

        await newUser.save();

        res.status(201).json({ message: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} registered successfully` });

        // Email (Non-blocking)
        const mailOptions = {
            to: email,
            subject: "Registration Notification",
            text: `Hello ${name},\n\nYou have successfully registered as a ${userRole}.\n\nBest regards,\nMediCare+ Team`,
        };
        sendMail(mailOptions).catch(err => console.error("Error sending email:", err));

    } catch (error) {
        console.error("Registration Error:", error);
        next(error);
    }
});

// Login
router.post("/login", async (req, res, next) => {
    try {

        const { email, password, role } = req.body;

        if (!role) {
            return res.status(400).json({ message: "Role is required for login" });
        }

        let user;
        if (role === "patient") user = await Patient.findOne({ email });
        else if (role === "doctor") user = await Doctor.findOne({ email });
        else return res.status(400).json({ message: "Invalid role" });

        if (!user) {
            // Check if user exists in other roles to give a better error
            let foundRole = null;
            if (await Patient.findOne({ email })) foundRole = "patient";
            else if (await Doctor.findOne({ email })) foundRole = "doctor";

            if (foundRole) {
                return res.status(400).json({ message: `Account found as ${foundRole}. Please select '${foundRole}' role.` });
            }
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const token = generateToken(user, role);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax", // Adjust based on cross-site needs
            maxAge: 7 * 24 * 60 * 60 * 1000,
        };

        res.cookie("token", token, cookieOptions);

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || role,
            },
        });

    } catch (error) {
        console.error("Login Error:", error);
        next(error);
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
});

export default router;
