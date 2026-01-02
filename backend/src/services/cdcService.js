import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Report from "../models/Report.js";
import Specialization from "../models/Specialization.js";
import redisClient from "../utils/redisClient.js";

const initCDC = () => {
    console.log("🔄 CDC Service Initialized: Listening for DB Changes...");

    // 1. Monitor Doctor Changes
    Doctor.watch().on("change", async (change) => {
        if (change.operationType === "update" || change.operationType === "delete") {
            const doctorId = change.documentKey._id;
            console.log(`⚡ CDC: Doctor Updated. Invalidating cache for: doctor:${doctorId}`);

            // Delete Specific Profile Cache
            await redisClient.del(`doctor:${doctorId}`);
            // Also invalidate reports created by this doctor? (Optional, maybe overkill)
            await redisClient.del(`reports:doctor:${doctorId}`);
        }
    });

    // 2. Monitor Patient Changes
    Patient.watch().on("change", async (change) => {
        if (change.operationType === "update" || change.operationType === "delete") {
            const patientId = change.documentKey._id;
            console.log(`⚡ CDC: Patient Updated. Invalidating cache for: patient:${patientId}`);

            await redisClient.del(`patient:${patientId}`);
            await redisClient.del(`reports:patient:${patientId}`);
        }
    });

    // 3. Monitor Specialization Changes
    Specialization.watch().on("change", async (change) => {
        console.log(`⚡ CDC: Specialization Changed. Invalidating: specializations:all`);
        await redisClient.del("specializations:all");
    });

    // 4. Monitor Report Creations
    Report.watch().on("change", async (change) => {
        if (change.operationType === "insert") {
            const report = change.fullDocument;
            const { patientId, doctorId } = report;

            console.log(`⚡ CDC: New Report Created.`);

            // Invalidate Lists
            await redisClient.del(`reports:patient:${patientId}`);
            await redisClient.del(`reports:doctor:${doctorId}`);
            console.log(`   -> Invalidated lists for Patient: ${patientId} & Doctor: ${doctorId}`);
        }
    });
};

export default initCDC;
