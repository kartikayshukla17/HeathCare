import express from "express";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js"; // We'll need this later
import { protect, authorize } from "../middleware/authMiddleware.js";
import redisClient from "../utils/redisClient.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ... (GET route remains unchanged) ...

// @desc    Get patient profile
// @route   GET /api/patient/profile
// @access  Private (Patient only)
router.get("/profile", protect, authorize("patient"), async (req, res, next) => {
    try {
        const cacheKey = `patient:${req.user.id}`;
        const cachedPatient = await redisClient.get(cacheKey);

        if (cachedPatient) {
            console.log("Serving Patient Profile from Cache");
            return res.status(200).json(JSON.parse(cachedPatient));
        }

        const patient = await Patient.findById(req.user.id).select("-password");
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(patient));
        res.status(200).json(patient);
    } catch (error) {
        next(error);
    }
});

// @desc    Update patient profile (bloodGroup, gender, DOB, address)
// @route   PUT /api/patient/profile
// @access  Private (Patient only)
router.put("/profile", protect, authorize("patient"), upload.single('image'), async (req, res, next) => {
    try {
        const { bloodGroup, gender, DOB, address } = req.body;

        const patient = await Patient.findById(req.user.id);

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        if (bloodGroup) patient.bloodGroup = bloodGroup;
        if (gender) patient.gender = gender;
        if (DOB) patient.DOB = DOB;
        if (address) patient.address = address;

        // Handle Image Upload
        if (req.file) {
            console.log("File received:", req.file.originalname, req.file.mimetype);
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            console.log("Generated Base64 length:", dataURI.length);
            patient.image = dataURI;
        } else {
            console.log("No file received in request");
        }

        const updatedPatient = await patient.save();

        res.status(200).json({
            success: true,
            data: updatedPatient,
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get patient appointments (Mocked/Actual)
// @route   GET /api/patient/appointments
// @access  Private (Patient only)
router.get("/appointments", protect, authorize("patient"), async (req, res, next) => {
    try {
        const appointments = await Appointment.find({ patientId: req.user.id })
            .populate("doctorId", "name specialization image")
            .sort({ date: 1, time: 1 });

        // Categorize appointments
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];

        const categorized = {
            today: [],
            upcoming: [],
            history: []
        };

        appointments.forEach(app => {
            const appDate = new Date(app.date);
            const appDateStr = appDate.toISOString().split("T")[0];

            // Normalize structure for frontend
            const formattedApp = {
                id: app._id,
                _id: app._id,
                doctorName: app.doctorId?.name || "Unknown Doctor",
                image: app.doctorId?.image,
                specialization: app.doctorId?.specialization,
                type: app.symptoms || "General Checkup",
                date: appDateStr,
                time: app.time,
                status: app.status,
                paymentStatus: app.paymentStatus,
                paymentMethod: app.paymentMethod,
                amount: app.amount,
                refundAmount: app.refundAmount,
                createdAt: app.createdAt
            };

            if (appDateStr === todayStr) {
                categorized.today.push(formattedApp);
            } else if (appDateStr > todayStr) {
                categorized.upcoming.push(formattedApp);
            } else {
                categorized.history.push(formattedApp);
            }
        });

        res.status(200).json(categorized);
    } catch (error) {
        next(error);
    }
});

export default router;
