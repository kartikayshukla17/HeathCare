import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const models = await genAI.listModels();
        console.log("Available Models:");
        for await (const model of models) {
            console.log(`- ${model.name} (${model.version}) [Methods: ${model.supportedGenerationMethods.join(", ")}]`);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
