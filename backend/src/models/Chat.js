import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    messages: [
        {
            role: {
                type: String,
                enum: ["user", "bot"],
                required: true,
            },
            text: {
                type: String,
                required: true,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);
