import mongoose from "mongoose";
import app from "./app.js";
import { config } from "dotenv";

import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });

const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/medicare_plus";
console.log("Attempting compatibility connect to:", MONGO_URI);

const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        process.exit(1);
    }
};

startServer();
