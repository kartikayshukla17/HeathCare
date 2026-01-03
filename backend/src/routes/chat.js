import express from "express";
import { chatWithRAG } from "../services/ragService.js";
import Chat from "../models/Chat.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Helper to save message
const saveMessage = async (userId, role, text) => {
    try {
        let chat = await Chat.findOne({ user: userId });
        if (!chat) {
            chat = new Chat({ user: userId, messages: [] });
        }
        chat.messages.push({ role, text });
        await chat.save();
    } catch (error) {
        console.error("Error saving chat message:", error);
    }
};

router.post("/", protect, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const userId = req.user._id;

        // 1. Get AI Response
        const response = await chatWithRAG(message, userId);

        // 2. Async Save to DB (Fire and forget to not block UI)
        saveMessage(userId, "user", message).then(() => {
            saveMessage(userId, "bot", response);
        });

        res.json({ response });
    } catch (error) {
        console.error("Chat Route Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/chat/history
router.get("/history", protect, async (req, res) => {
    try {
        const chat = await Chat.findOne({ user: req.user._id });
        if (!chat) {
            return res.json({ messages: [] });
        }
        // Return only role and text to match frontend format
        const formattedMessages = chat.messages.map(m => ({
            role: m.role,
            text: m.text
        }));
        res.json({ messages: formattedMessages });
    } catch (error) {
        console.error("Fetch History Error:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

export default router;
