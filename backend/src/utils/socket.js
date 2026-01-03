import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        // console.log("New client connected:", socket.id);

        // Join a room based on user ID (sent from client)
        socket.on("join", (userId) => {
            if (userId) {
                socket.join(userId);
                // console.log(`Socket ${socket.id} joined room ${userId}`);
            }
        });

        socket.on("disconnect", () => {
            // console.log("Client disconnected:", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
