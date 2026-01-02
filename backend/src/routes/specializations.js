import express from "express";
import Specialization from "../models/Specialization.js";

import redisClient from "../utils/redisClient.js";

const router = express.Router();

// @desc    Get all specializations
// @route   GET /api/specializations
// @access  Public
router.get("/", async (req, res, next) => {
    try {
        const cacheKey = "specializations:all";

        // 1. Try to fetch from Redis
        const cachedSpecs = await redisClient.get(cacheKey);
        if (cachedSpecs) {
            console.log("Serving Specializations from Cache");
            return res.status(200).json(JSON.parse(cachedSpecs)); // Return early
        }

        // 2. Fetch from DB if cache miss
        const specs = await Specialization.find().sort({ name: 1 });

        // 3. Store in Redis (TTL: 24h = 86400 seconds)
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(specs));

        res.status(200).json(specs);
    } catch (error) {
        next(error);
    }
});

// @desc    Create new specialization
// @route   POST /api/specializations
// @access  Public
router.post("/", async (req, res, next) => {
    try {
        const { name, description, image } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Name is required" });
        }

        const newSpec = new Specialization({
            name,
            description,
            image
        });

        const savedSpec = await newSpec.save();

        res.status(201).json(savedSpec);
    } catch (error) {
        next(error);
    }
});

export default router;
