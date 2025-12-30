import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Routes
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctor.js';
import patientRoutes from './routes/patient.js';
import appointmentRoutes from './routes/appointments.js';
import taskRoutes from './routes/tasks.js';
import inviteRoutes from './routes/invites.js';
import organizationRoutes from './routes/organization.js';
import notificationRoutes from './routes/notifications.js';
import specializationRoutes from './routes/specializations.js';
import paymentRoutes from './routes/payment.js';
import reportRoutes from './routes/report.js';

// Middleware / Utils
import errorHandler from './middleware/errorMiddleware.js';
import { initSocket } from './utils/socket.js';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we point to the root .env (one level up from src) or adjacent to package.json
dotenv.config({ path: path.join(path.dirname(__dirname), '.env') });

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(cookieParser()); // Parse cookies
app.use(express.json());
app.use(cors({
    origin: [CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"],
    credentials: true // Allow cookies
}));

// Initialize Socket.io
initSocket(httpServer);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/medicare_plus")
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.log('❌ DB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/specializations', specializationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
    res.send('MediCare+ API is Running');
});

// Error Handler (must be last middleware)
app.use(errorHandler);

const server = httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
