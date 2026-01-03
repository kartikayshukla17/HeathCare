import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";

// Lazy Load Components
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const DoctorProfileSetup = lazy(() => import("./pages/DoctorProfileSetup"));
const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const PatientProfileSetup = lazy(() => import("./pages/PatientProfileSetup"));
const BookAppointment = lazy(() => import("./pages/BookAppointment"));
const MyAppointments = lazy(() => import("./pages/MyAppointments"));
const DoctorReports = lazy(() => import("./pages/DoctorReports"));
const PatientReports = lazy(() => import("./pages/PatientReports"));
const Chatbot = lazy(() => import("./components/Chatbot"));

function App() {
  return (
    <BrowserRouter>
      <div className="font-sans antialiased text-gray-900 dark:text-white">
        <Suspense fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        }>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Patient Routes */}
            <Route path="/" element={
              <PrivateRoute restrictedRole="patient">
                <PatientDashboard />
              </PrivateRoute>
            } />

            <Route path="/patient/setup" element={
              <PrivateRoute restrictedRole="patient">
                <PatientProfileSetup />
              </PrivateRoute>
            } />

            <Route path="/patient/book-appointment" element={
              <PrivateRoute restrictedRole="patient">
                <BookAppointment />
              </PrivateRoute>
            } />

            {/* Aliases/Missing Routes */}
            <Route path="/book-appointment" element={
              <PrivateRoute restrictedRole="patient">
                <BookAppointment />
              </PrivateRoute>
            } />
            <Route path="/appointments" element={
              <PrivateRoute restrictedRole="patient">
                <MyAppointments />
              </PrivateRoute>
            } />
            <Route path="/history" element={
              <PrivateRoute restrictedRole="patient">
                <MyAppointments />
              </PrivateRoute>
            } />
            <Route path="/patient/reports" element={
              <PrivateRoute restrictedRole="patient">
                <PatientReports />
              </PrivateRoute>
            } />

            {/* Doctor Routes */}
            <Route path="/doctor/dashboard" element={
              <PrivateRoute restrictedRole="doctor">
                <DoctorDashboard />
              </PrivateRoute>
            } />

            <Route path="/doctor/setup" element={
              <PrivateRoute restrictedRole="doctor">
                <DoctorProfileSetup />
              </PrivateRoute>
            } />

            <Route path="/doctor/reports" element={
              <PrivateRoute restrictedRole="doctor">
                <DoctorReports />
              </PrivateRoute>
            } />

          </Routes>
        </Suspense>
        <Suspense fallback={null}>
          <Chatbot />
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
