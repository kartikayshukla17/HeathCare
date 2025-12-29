import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Temporary Home Component
const Home = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-white">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to MediCare+</h1>
      <p className="mb-4">You are logged in!</p>
      <button
        onClick={() => {
          localStorage.removeItem('user');
          window.location.reload();
        }}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Logout
      </button>
    </div>
  </div>
);

// Protected Route Component (Basic Implementation)
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="font-sans antialiased text-gray-900 dark:text-white">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
