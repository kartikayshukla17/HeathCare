# HealthCare+

A comprehensive healthcare management platform connecting patients and doctors.

## Features
- **User Roles**: Patient & Doctor portals with specialized dashboards.
- **Authentication**: Secure Login/Signup with specialized fields (e.g., Doctor Specialization).
- **Appointment Booking**:
    - **Real-time Slot Availability**: Visual indicators for efficient booking (Max 6 patients/slot).
    - **Payment Integration**: Razorpay (Online) and Pay at Clinic (Cash).
    - **Status Tracking**: Track payment status (Paid/Pending) and Appointment status.
- **Water Intake Tracker**:
    - **Daily Goals**: Gender-based hydration goals (Male: 3.7L, Female: 2.7L).
    - **Visual Logger**: Circular progress widget with quick-add functionality.
    - **Daily Reset**: Automatically resets intake at midnight.
- **Medical Reports**:
    - **Generation**: Doctors can generate detailed digital reports with prescriptions.
    - **Real-Time Delivery**: Patients receive reports instantly via Socket.io.
    - **PDF Download**: Download Reports, Appointment Slips, and Payment Receipts as PDFs.
- **Cancellation System**: Smart cancellation logic with automated refund policies for Patients and Doctors.
- **Interactive Calendar**: Custom-styled FullCalendar for tracking appointments with status indicators.
- **Enhanced UI/UX**:
    - **Modern Design**: Glassmorphism, smooth animations, and responsive layouts.
    - **Dark Mode**: Fully supported dark mode across all screens.
    - **Profile Management**: Profile picture upload and instant sync.
- **AI Chatbot Assistant (RAG)**:
    - **Context-Aware**: Knows user's specific confirmed appointments and recent medical reports.
    - **Intelligent Queries**: Answers questions like "When is my next visit?" or "What medicines do I take?".
    - **Robust Architecture**: Implements Model Fallback (Auto-switches from Gemini 2.5 to 1.5 on failure) and Context Stuffing.
    - **Tech**: Integrated with **Google Gemini API**.
- **Performance & Scalability**:
    - **Redis Caching**: Cache-Aside strategy for high-read data (Profiles, Reports, Specializations).
    - **CDC (Change Data Capture)**: MongoDB Change Streams for automated, reliable cache invalidation.
    - **Dockerized**: Full stack containerization (Frontend, Backend, Mongo, Redis).

## Tech Stack
- **Frontend**: React (Vite), Redux Toolkit, Tailwind CSS, Lucide Icons, Socket.io Client.
- **Backend**: Node.js, Express, MongoDB (Replica Set), Mongoose, Socket.io.
- **Caching**: Redis, Redis Commander (UI).
- **DevOps**: Docker, Docker Compose.
- **Tools**: `jspdf` (PDF Generation), `nodemailer` (Email Notifications).

## Getting Started

### Prerequisites
- Docker Desktop (Required for full stack)
- Node.js (v14+) (If running locally without Docker)

### Installation (Docker - Recommended)

1.  **Clone the repository**
    ```bash
    git clone https://github.com/kartikayshukla17/HeathCare-.git
    cd HeathCare-
    ```

2.  **Start Services**
    ```bash
    docker-compose up --build
    ```
    This will start Backend (5001), Frontend (5173), MongoDB (27017), Redis (6379), and Redis Commander (8081).

3.  **Access Application**
    - **Frontend**: [http://localhost:5173](http://localhost:5173)
    - **Redis UI**: [http://localhost:8081](http://localhost:8081)

### Installation (Manual)

1.  **Clone the repository**
    ```bash
    git clone https://github.com/kartikayshukla17/HeathCare-.git
    cd HeathCare-
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    # Ensure Redis is running locally on port 6379
    npm run dev
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
