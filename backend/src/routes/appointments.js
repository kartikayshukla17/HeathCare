import express from "express";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Specialization from "../models/Specialization.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import sendMail from "../controllers/mailController.js";
import { getSlotStatus } from "../controllers/slotController.js";

const router = express.Router();

// @desc    Get all doctors (with optional specialization filter)
// @route   GET /api/appointments/doctors
// @access  Private (Patient protected, or Public?) - typically protected
router.get("/doctors", protect, async (req, res, next) => {
    try {
        const { specialization } = req.query;
        let query = {};

        if (specialization && specialization !== 'All') {
            const specDoc = await Specialization.findOne({ name: specialization });
            if (specDoc) {
                query.specialization = specDoc._id;
            } else {
                // If specialization name provided but not found in DB, return empty list
                return res.status(200).json([]);
            }
        }

        const doctors = await Doctor.find(query).select("-password").populate("specialization");
        res.status(200).json(doctors);
    } catch (error) {
        next(error);
    }
});

// @desc    Get doctor by ID
// @route   GET /api/appointments/doctors/:id
// @access  Private
router.get("/doctors/:id", protect, async (req, res, next) => {
    try {
        const doctor = await Doctor.findById(req.params.id).select("-password").populate("specialization");
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }
        res.status(200).json(doctor);
    } catch (error) {
        next(error);
    }
});

// @desc    Get slot booking status
// @route   GET /api/appointments/slots
// @access  Private
router.get("/slots", protect, getSlotStatus);

// @desc    Book an appointment
// @route   POST /api/appointments/book
// @access  Private (Patient)
router.post("/book", protect, authorize("patient"), async (req, res, next) => {
    try {
        const { doctorId, date, time, symptoms, paymentMethod } = req.body;

        // 1. Check if doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        // 2. Check if slot is available (Max 6 patients)
        const appointmentDate = new Date(date);

        const existingCount = await Appointment.countDocuments({
            doctorId,
            date: appointmentDate,
            time,
            status: { $ne: "cancelled" }
        });

        if (existingCount >= 6) {
            return res.status(400).json({ message: "Slot is fully booked" });
        }

        // Check if patient already booked this slot
        const userBooking = await Appointment.findOne({
            doctorId,
            date: appointmentDate,
            time,
            patientId: req.user.id,
            status: { $ne: "cancelled" }
        });

        if (userBooking) {
            return res.status(400).json({ message: "You have already booked this slot" });
        }

        // 3. Create Appointment
        let paymentStatus = "Pending";
        if (paymentMethod === "Razorpay") {
            paymentStatus = "Paid"; // Simulating immediate success
        }

        const appointment = new Appointment({
            patientId: req.user.id,
            doctorId,
            date: appointmentDate,
            time,
            symptoms,
            amount: 500, // Fixed fee for now, or fetch from doctor if added
            paymentMethod,
            paymentStatus,
            status: "confirmed" // Auto-confirm for now
        });

        await appointment.save();

        // Send Confirmation Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: req.user.email,
            subject: 'Appointment Confirmation - HealthCare+',
            text: `Dear ${req.user.name},

Your appointment with Dr. ${doctor.name} has been successfully booked.

Details:
Date: ${date}
Time: ${time}
Symptoms: ${symptoms || 'N/A'}

Thank you for choosing HealthCare+.`
        };

        sendMail(mailOptions).catch(err => console.error("Error sending confirmation email:", err));

        res.status(201).json({
            message: "Appointment booked successfully",
            appointment
        });

    } catch (error) {
        next(error);
    }
});

export default router;

// @desc    Cancel an appointment
// @route   POST /api/appointments/cancel/:id
// @access  Private (Patient/Doctor)
router.post("/cancel/:id", protect, async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Authorization Check
        if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to cancel this appointment" });
        }
        if (req.user.role === 'doctor' && appointment.doctorId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to cancel this appointment" });
        }

        // Calculate Time Difference
        // Construct ISO string: "YYYY-MM-DDTHH:mm:00"
        let dateStr = appointment.date.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeParts = appointment.time.split('-');
        const startTime = timeParts[0].trim(); // "09:00"

        const appointmentDateTime = new Date(`${dateStr}T${startTime}:00`);
        const now = new Date();

        const diffMs = appointmentDateTime - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        let refundPercentage = 0;
        let refundAmount = 0;
        const paidAmount = appointment.amount || 0;

        if (req.user.role === 'patient') {
            // Patient Cancellation Logic
            if (diffHours > 6) {
                refundPercentage = 100;
            } else if (diffHours > 2) {
                refundPercentage = 50;
            } else {
                refundPercentage = 0;
            }

            // Calculate refund amount
            refundAmount = (paidAmount * refundPercentage) / 100;

            appointment.status = "cancelled";
            appointment.refundAmount = refundAmount;
            if (refundAmount > 0) {
                appointment.paymentStatus = "Refunded";
            }

        } else if (req.user.role === 'doctor') {
            // Doctor Cancellation Logic
            if (diffHours < 2) {
                return res.status(400).json({ message: "Cannot cancel appointments within 2 hours of start time." });
            }

            appointment.status = "cancelled";
            appointment.refundAmount = paidAmount;
            appointment.paymentStatus = "Refunded";
        }

        await appointment.save();

        res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully",
            refundPercentage,
            refundAmount,
            status: appointment.status
        });

    } catch (error) {
        next(error);
    }
});

// @desc    Cancel ALL appointments for a doctor
// @route   POST /api/appointments/cancel-all
// @access  Private (Doctor Only)
router.post("/cancel-all", protect, authorize('doctor'), async (req, res, next) => {
    try {
        const doctorId = req.user.id;

        // Find all active appointments
        const appointments = await Appointment.find({
            doctorId: doctorId,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (appointments.length === 0) {
            return res.status(200).json({ message: "No active appointments to cancel." });
        }

        const now = new Date();
        const nonCancellable = [];

        // Check time constraints
        for (const appt of appointments) {
            let dateStr = appt.date.toISOString().split('T')[0];
            const timeParts = appt.time.split('-');
            const startTime = timeParts[0].trim();
            const apptDateTime = new Date(`${dateStr}T${startTime}:00`);

            const diffHours = (apptDateTime - now) / (1000 * 60 * 60);

            if (diffHours < 2) {
                nonCancellable.push(appt);
            }
        }

        if (nonCancellable.length > 0) {
            return res.status(400).json({
                message: "Cannot cancel all. Some appointments are within 2 hours.",
                count: nonCancellable.length
            });
        }

        // Proceed to cancel all
        const result = await Appointment.updateMany(
            {
                doctorId: doctorId,
                status: { $in: ['pending', 'confirmed'] }
            },
            {
                $set: {
                    status: 'cancelled',
                    paymentStatus: 'Refunded',
                    refundAmount: 0 // Ideally we should copy the amount, but for bulk this is tricky.
                }
            }
        );

        res.status(200).json({
            success: true,
            message: `Successfully cancelled all ${result.modifiedCount} appointments.`
        });

    } catch (error) {
        next(error);
    }
});
