import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Specialization from "../models/Specialization.js";
import { doctors } from "../../data-doc-patient/doctors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(path.dirname(path.dirname(__dirname)), '.env') });

const seedSpecializations = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // console.log("✅ Connected to MongoDB");

        // Extract unique specializations
        const uniqueSpecs = [...new Set(doctors.map(doc => doc.specialization))];
        // console.log(`Found ${uniqueSpecs.length} unique specializations.`);

        // Prepare docs
        const specDocs = uniqueSpecs.map(name => ({
            name,
            description: `Specialists in ${name}`,
            image: "" // Could map images if available, or leave empty for frontend defaults
        }));

        // Upsert to avoid duplicates or clearing needed data if we want to preserve
        // But for a seed, we can just clear and re-insert, OR upsert.
        // Let's clear for clean state as this is initial setup.
        await Specialization.deleteMany({});
        // console.log("🗑️  Cleared existing specializations");

        await Specialization.insertMany(specDocs);
        // console.log(`🌱 Seeded ${specDocs.length} specializations`);

        process.exit();
    } catch (error) {
        console.error("❌ Error seeding specializations:", error);
        process.exit(1);
    }
};

seedSpecializations();
