import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },
        diagnosis: {
            type: String,
            required: true,
        },
        prescriptions: [
            {
                medicine: {
                    type: String,
                    required: true,
                },
                frequency: {
                    type: String,
                    enum: ["Once", "Twice", "Thrice"], // Morning, Afternoon, Evening mapping can be handled on frontend or just simplistic for now
                    required: true,
                },
                duration: {
                    type: String, // e.g. "5 days"
                }
            }
        ],
        generatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const Report = mongoose.model("Report", ReportSchema);
export default Report;
