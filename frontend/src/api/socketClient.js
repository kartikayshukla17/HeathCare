import { io } from 'socket.io-client';

// Should match backend URL
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

let socket;

export const initSocket = (userId) => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
        });

        socket.on('connect', () => {
            // console.log('Socket connected:', socket.id);
            if (userId) {
                socket.emit('join', userId);
            }
        });
    }
    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
