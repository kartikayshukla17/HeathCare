import express from 'express';
import Appointment from '../models/Appointment.js';
import sendMail from '../controllers/mailController.js';

const router = express.Router();

// @desc    Trigger Appointment Reminders
// @route   GET /api/notifications/reminders
// @access  Public (or Protected Admin) - Public for cron simplicity in hackathon
router.get('/reminders', async (req, res) => {
    try {
        // Calculate "Tomorrow"
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Start of tomorrow
        const startOfDay = new Date(tomorrow.setHours(0, 0, 0, 0));
        // End of tomorrow
        const endOfDay = new Date(tomorrow.setHours(23, 59, 59, 999));

        console.log(`Checking reminders for: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

        const appointments = await Appointment.find({
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: "confirmed",
            reminderSent: false
        })
            .populate("patientId")
            .populate("doctorId");

        console.log(`Found ${appointments.length} appointments to remind.`);

        let sentCount = 0;

        for (const appt of appointments) {
            if (appt.patientId && appt.patientId.email) {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: appt.patientId.email,
                    subject: 'Appointment Reminder - HealthCare+',
                    text: `Dear ${appt.patientId.name},

This is a reminder for your appointment tomorrow.

Details:
Doctor: Dr. ${appt.doctorId?.name}
Date: ${appt.date.toDateString()}
Time: ${appt.time}

Please join on time.

HealthCare+ Team`
                };

                // Send mail asynchronously but we wait here to mark flag
                await sendMail(mailOptions);

                appt.reminderSent = true;
                await appt.save();
                sentCount++;
            }
        }

        res.status(200).json({
            success: true,
            message: `Sent ${sentCount} reminders`,
            totalFound: appointments.length
        });

    } catch (error) {
        console.error("Reminder Error:", error);
        res.status(500).json({ message: "Failed to send reminders", error: error.message });
    }
});

export default router;
