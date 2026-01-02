import express from "express";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import redisClient from "../utils/redisClient.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ... (GET route remains unchanged) ...

// @desc    Get doctor profile
// @route   GET /api/doctor/profile
// @access  Private (Doctor only)
router.get("/profile", protect, authorize("doctor"), async (req, res, next) => {
    try {
        const cacheKey = `doctor:${req.user.id}`;
        const cachedDoc = await redisClient.get(cacheKey);

        if (cachedDoc) {
            console.log("Serving Doctor Profile from Cache");
            return res.status(200).json(JSON.parse(cachedDoc));
        }

        const doctor = await Doctor.findById(req.user.id).select("-password");
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(doctor));
        res.status(200).json(doctor);
    } catch (error) {
        next(error);
    }
});

// @desc    Update doctor profile (availability, etc.)
// @route   PUT /api/doctor/profile
// @access  Private (Doctor only)
router.put("/profile", protect, authorize("doctor"), upload.single('image'), async (req, res, next) => {
    try {
        // Parse availability if it's sent as a string (FormData often sends arrays/objects as JSON strings)
        let { availability, specialization, fees, experience } = req.body;

        if (typeof availability === 'string') {
            try {
                availability = JSON.parse(availability);
            } catch (e) {
                console.error("Failed to parse availability", e);
            }
        }

        const doctor = await Doctor.findById(req.user.id);

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        // Update fields if provided
        if (availability) doctor.availability = availability;
        if (specialization) doctor.specialization = specialization;
        if (fees) doctor.fees = fees;
        if (experience) doctor.experience = experience;

        // Handle Image Upload
        if (req.file) {
            console.log("File received:", req.file.originalname, req.file.mimetype);
            // Convert buffer to Base64
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            console.log("Generated Base64 length:", dataURI.length);
            doctor.image = dataURI;
        } else {
            console.log("No file received in request");
        }

        const updatedDoctor = await doctor.save();

        res.status(200).json({
            success: true,
            data: updatedDoctor,
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get doctor appointments
// @route   GET /api/doctor/appointments
// @access  Private (Doctor only)
router.get("/appointments", protect, authorize("doctor"), async (req, res, next) => {
    try {
        // Fetch appointments for this doctor
        // Populate patient details
        const appointments = await Appointment.find({ doctorId: req.user.id })
            .populate("patientId", "name email gender DOB")
            .sort({ date: 1, time: 1 });

        res.status(200).json(appointments);
    } catch (error) {
        next(error);
    }
});

export default router;
