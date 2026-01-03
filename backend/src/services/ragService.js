import { GoogleGenerativeAI } from "@google/generative-ai";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import Report from "../models/Report.js";

let genAI;
let model;
let doctorContext = "";

export const initRAG = async () => {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️ GEMINI_API_KEY not found. Chatbot will not function.");
        return;
    }

    try {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Attempt to use the requested model
        const requestedModel = "gemini-2.5-flash";
        const fallbackModel = "gemini-1.5-flash";

        console.log(`🤖 Initializing Chatbot with model: ${requestedModel}...`);
        model = genAI.getGenerativeModel({ model: requestedModel });

        // Health Check: Try a dummy generation to verify model exists
        try {
            await model.generateContent("test");
            console.log(`✅ Model '${requestedModel}' is valid and working.`);
        } catch (modelError) {
            console.warn(`⚠️ Model '${requestedModel}' failed (likely 404). Falling back to '${fallbackModel}'.`);
            console.warn(`Error details: ${modelError.message}`);
            model = genAI.getGenerativeModel({ model: fallbackModel });
        }

        console.log("Listen: Loading doctor data for Chat Context...");
        await loadDoctorContext();
        console.log(`✅ Chatbot Ready with doctor context (${doctorContext.length} chars).`);
    } catch (error) {
        console.error("❌ Chatbot Initialization Error:", error);
    }
};

const loadDoctorContext = async () => {
    try {
        const doctors = await Doctor.find().populate("specialization");

        const docsList = doctors.map(doc => {
            const specName = doc.specialization?.name || "General";
            const availability = doc.availability.map(a => `${a.day} (${a.slots.join(", ")})`).join("; ");
            return `Dr. ${doc.name} (ID: ${doc._id}) is a ${specName} specialist. Gender: ${doc.gender}. Available: ${availability}.`;
        });

        doctorContext = docsList.join("\n");

    } catch (error) {
        console.error("Error loading doctor context:", error);
    }
};

const fetchUserContext = async (userId) => {
    if (!userId) return "";

    try {
        // 1. Fetch Upcoming Appointments
        const appointments = await Appointment.find({
            patientId: userId,
            status: "confirmed",
            date: { $gte: new Date() }
        })
            .populate("doctorId", "name specialization")
            .sort({ date: 1 })
            .limit(3);

        // 2. Fetch Recent Reports
        const reports = await Report.find({ patientId: userId })
            .populate("doctorId", "name")
            .sort({ generatedAt: -1 })
            .limit(3);

        let contextString = "\n\n=== USER SPECIFIC CONTEXT ===\n";

        if (appointments.length > 0) {
            contextString += "UPCOMING APPOINTMENTS:\n";
            appointments.forEach(appt => {
                const docName = appt.doctorId?.name || "Unknown Doctor";
                const dateStr = new Date(appt.date).toLocaleDateString();
                contextString += `- On ${dateStr} at ${appt.time} with Dr. ${docName} (${appt.symptoms}). Status: ${appt.paymentStatus} ($${appt.amount}). Prescription: ${appt.prescription || "None"}\n`;
            });
        } else {
            contextString += "No upcoming appointments found.\n";
        }

        // 1.5 Fetch Past Appointments (History)
        const pastAppointments = await Appointment.find({
            patientId: userId,
            date: { $lt: new Date() }
        })
            .populate("doctorId", "name specialization")
            .sort({ date: -1 })
            .limit(5);

        if (pastAppointments.length > 0) {
            contextString += "\nPAST APPOINTMENT HISTORY:\n";
            pastAppointments.forEach(appt => {
                const docName = appt.doctorId?.name || "Unknown Doctor";
                const dateStr = new Date(appt.date).toLocaleDateString();
                contextString += `- On ${dateStr} with Dr. ${docName}. Status: ${appt.status}. Payment: ${appt.paymentStatus}. Diagnosis/Notes: ${appt.prescription || "None"}\n`;
            });
        }

        if (reports.length > 0) {
            contextString += "\nRECENT MEDICAL REPORTS:\n";
            reports.forEach(report => {
                const docName = report.doctorId?.name || "Unknown Doctor";
                const dateStr = new Date(report.generatedAt).toLocaleDateString();
                contextString += `- Report from Dr. ${docName} on ${dateStr}: Diagnosis: "${report.diagnosis}". Prescriptions: ${report.prescriptions.map(p => `${p.medicine} (${p.frequency}, ${p.duration || 'N/A'})`).join("; ")}\n`;
            });
        } else {
            contextString += "No medical reports found.\n";
        }

        contextString += "===========================\n";
        return contextString;

    } catch (error) {
        console.error("Error fetching user context:", error);
        return "";
    }
};

export const chatWithRAG = async (userQuery, userId) => {
    if (!genAI) {
        return "I am currently offline or not configured correctly. Please contact support.";
    }

    try {
        // Fetch User Specific Data
        const userContext = await fetchUserContext(userId);

        const SYSTEM_INSTRUCTION = `You are a helpful AI assistant for a hospital management system called "MediCare+".
Your role is to assist patients in finding doctors, checking availability, and understanding hospital services.

Use the provided "Doctor and Specialization Data" AND "USER SPECIFIC CONTEXT" to answer user queries.

If a user asks how to book an appointment, guide them: "To book an appointment, please navigate to the 'Doctors' page, select your preferred doctor, and click on their profile to view available slots."

Specific Guidance for User Data:
- If asked about "my appointments", check the "UPCOMING APPOINTMENTS" section.
- If asked about "medications", "prescriptions", or "diagnosis", check the "RECENT MEDICAL REPORTS" section.
- If the user asks "what is my prescription?" and has multiple reports, list the medications from the most recent one.

Rules:
1. Answer strictly based on the provided context.
2. Be polite, professional, and concise.
3. Do NOT make up information.
4. Do NOT use markdown formatting (no bold/italic). Keep the text plain.
5. If listing doctors, list them clearly with their specialization.
`;

        const prompt = `
        ${SYSTEM_INSTRUCTION}

        Here is the complete list of available doctors and their details:
        ---
        ${doctorContext}
        ---

        ${userContext}

        User Question: ${userQuery}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Chat Error:", error);
        return "I'm having trouble connecting right now. Please try again later.";
    }
};
