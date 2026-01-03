import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import Doctor from "../models/Doctor.js";
import Specialization from "../models/Specialization.js";
import { doctors } from "../../data-doc-patient/doctors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(path.dirname(path.dirname(__dirname)), '.env') });

const seedDoctors = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // console.log("✅ Connected to MongoDB");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        // Clear existing doctors (Optional: remove this if we want to keep manual ones, 
        // but for seeding consistent data, clearing is usually safer. 
        // I will clear for now to ensure IDs and data match expectations).
        await Doctor.deleteMany({});
        // console.log("🗑️  Cleared existing doctors");

        const doctorDocs = await Promise.all(doctors.map(async (doc) => {
            // Find specialization ID
            const spec = await Specialization.findOne({ name: doc.specialization });
            if (!spec) {
                console.warn(`Specialization not found for doctor ${doc.name}: ${doc.specialization}`);
                // Create it if missing? Or skip. For seed, let's create or fail.
                // Assuming seedSpecializations ran first, strict check:
                // But let's be robust and create if needed for the seed.
                const newSpec = await Specialization.create({ name: doc.specialization, description: `Specialists in ${doc.specialization}` });
                return {
                    name: doc.name,
                    email: `doctor${doc.id}@medicare.com`,
                    password: hashedPassword,
                    specialization: newSpec._id,
                    gender: doc.gender,
                    image: doc.image,
                    availability: doc.availability,
                    role: "doctor"
                };
            }
            return {
                name: doc.name,
                email: `doctor${doc.id}@medicare.com`,
                password: hashedPassword,
                specialization: spec._id,
                gender: doc.gender,
                image: doc.image,
                availability: doc.availability,
                role: "doctor"
            };
        }));

        await Doctor.insertMany(doctorDocs);
        // console.log(`🌱 Seeded ${doctorDocs.length} doctors with linked specializations`);

        process.exit();
    } catch (error) {
        console.error("❌ Error seeding doctors:", error);
        process.exit(1);
    }
};

seedDoctors();
