import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed"],
            default: "pending",
        },
        symptoms: {
            type: String,
            required: true,
        },
        prescription: {
            type: String, // Can be text or a URL to a file
            default: "",
        },
        amount: {
            type: Number,
            required: true,
            default: 0,
        },
        paymentMethod: {
            type: String,
            enum: ["Cash", "Razorpay"],
            default: "Cash",
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed", "Refunded"],
            default: "Pending",
        },
        refundAmount: {
            type: Number,
            default: 0,
        },
        reminderSent: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Appointment = mongoose.model("Appointment", AppointmentSchema);
export default Appointment;
