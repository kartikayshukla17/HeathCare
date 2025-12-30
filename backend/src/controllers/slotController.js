import Appointment from "../models/Appointment.js";

// @desc    Get slot usage for a doctor on a specific date
// @route   GET /api/appointments/slots?doctorId=...&date=...
export const getSlotStatus = async (req, res, next) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({ message: "Doctor ID and Date are required" });
        }

        const queryDate = new Date(date);
        // Ensure we search for the whole day 00:00 to 23:59
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        const appointments = await Appointment.find({
            doctorId,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: "cancelled" }
        });

        // Aggregation: Count appointments per time slot
        const slotCounts = {};
        appointments.forEach(appt => {
            if (slotCounts[appt.time]) {
                slotCounts[appt.time]++;
            } else {
                slotCounts[appt.time] = 1;
            }
        });

        res.status(200).json(slotCounts);
    } catch (error) {
        next(error);
    }
};
