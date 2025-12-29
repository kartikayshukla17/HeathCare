# 🏥 MediCare+ – Smart Hospital Management System

A full-stack **MERN-based hospital management system** designed to digitize and streamline hospital operations for **patients, doctors, and administrators**.

## 🚀 Features

### 👤 Patient Panel
- **Secure Authentication**: Register and login with role-based access.
- **Dashboard**: View appointment history and manage profile.
- **Appointment Booking**: Book appointments with doctors.
- **Medical Reports**: Upload and view prescriptions/reports.

### 🩺 Doctor Panel
- **Appointment Management**: View and update appointment status.
- **Prescriptions**: Issue digital prescriptions to patients.
- **Schedule**: Manage availability (coming soon).

### 🛠️ Admin Panel
- **User Management**: Manage doctors and patients.
- **Analytics**: View hospital statistics.

## 💻 Tech Stack
- **Frontend**: React (Vite), Tailwind CSS (Zinc/Dark Theme), React Router.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Authentication**: JWT (JSON Web Tokens), Role-Based Access Control.

## 🔧 Setup & Installation

### Prerequisites
- Node.js installed.
- MongoDB instance (Local or Atlas) URI.

### Steps
1. **Clone the repository**
   ```bash
   git clone https://github.com/AbhijeetRaghuvanshi123/CollabProject.git
   cd CollabProject
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file with:
   # PORT=8000
   # MONGO_URI=your_mongodb_connection_string
   # JWT_SECRET=your_jwt_secret
   # CLIENT_URL=http://localhost:5173
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🎨 UI/UX
- **Theme**: Dark (Zinc 900/800) and Light modes.
- **Design**: Clean, modern, professional medical interface.
