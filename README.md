# HealthCare+

A comprehensive healthcare management platform connecting patients and doctors.

## Features
- **User Roles**: Patient & Doctor portals with specialized dashboards.
- **Authentication**: Secure Login/Signup with specialized fields (e.g., Doctor Specialization).
- **Appointment Booking**:
    - **Real-time Slot Availability**: Visual indicators for efficient booking (Max 6 patients/slot).
    - **Payment Integration**: Razorpay (Online) and Pay at Clinic (Cash).
    - **Status Tracking**: Track payment status (Paid/Pending) and Appointment status.
- **Medical Reports**:
    - **Generation**: Doctors can generate detailed digital reports with prescriptions.
    - **Real-Time Delivery**: Patients receive reports instantly via Socket.io.
    - **PDF Download**: Download Reports, Appointment Slips, and Payment Receipts as PDFs.
- **Cancellation System**: Smart cancellation logic with automated refund policies for Patients and Doctors.
- **Interactive Calendar**: Visual calendar for tracking appointments.

## Tech Stack
- **Frontend**: React (Vite), Redux Toolkit, Tailwind CSS, Lucide Icons, Socket.io Client.
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.io.
- **Tools**: `jspdf` (PDF Generation), `nodemailer` (Email Notifications).

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (Running locally or Atlas URI)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/kartikayshukla17/HeathCare-.git
    cd HeathCare-
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    # Create .env file with PORT, MONGO_URI, JWT_SECRET, etc.
    npm run dev
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
