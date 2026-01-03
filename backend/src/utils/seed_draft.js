import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import Doctor from "../models/Doctor.js";
import { doctors } from "../../data-doc-patient/doctors.json" assert { type: "json" };
// Note: importing JSON with assert/with syntax might depend on node version. 
// Alternatively, I can read the file with fs if import fails, but since this is modern node, we'll try standard import or just copy the data if needed.
// Actually, doctors.json is 'export const doctors = ...' in the file viewed previously! 
// So it is a JS file, not JSON. It just happens to be in a folder named *.json or referenced as such.
// Let's re-verify the file content of doctors.json.
// The file path viewed was /backend/data-doc-patient/doctors.json but the content started with `export const doctors = [`
// This is actually invalid JSON. It is a JS file. 
// I will import it as a module.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(path.dirname(path.dirname(__dirname)), '.env') });

const seedDoctors = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // console.log("✅ Custom Seed: Connected to MongoDB");

        // We will NOT clear all doctors to preserve manually created ones, 
        // OR we can clear if we want a clean slate. 
        // For this task, "push all data", I'll clear to avoid duplicates or complex upsert logic for now, 
        // assuming this is initialization.
        // Wait, if I clear, I lose the user's test account. 
        // I will check if a doctor with the specific name exists, if not create. 
        // Use the ID from the file to track? MongoDB uses _id.
        // I'll just check by email.

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        // Import dynamic because the path is relative and might be tricky with .. navigation depending on execution context, 
        // but standard import should work if paths are correct.
        // We need to import the array.
        // Since I can't easily dynamic import a file that might not be a valid module if the extension says .json but content is JS?
        // The file is named `doctors.json` but content is `export const doctors = ...`.
        // This is problematic. Node will try to parse .json as JSON and fail.
        // I should probably fix the file extension or read it as text and eval (bad) or fix the file to be valid JSON.
        // Since I can edit files, I will first convert `doctors.json` to valid JSON or rename it to `doctors.js`.
        // The user called it `doctors.json`.
        // I'll assume I should fix it or just read it as a file and parse it manually? 
        // No, simplest is to rename/fix it.
        // Actually, I'll just read the file content, strip the export const part, and parse.

    } catch (error) {
        console.error("❌ Error connecting/seeding:", error);
        process.exit(1);
    }
};
