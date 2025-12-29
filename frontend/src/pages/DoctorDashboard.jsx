import React, { useEffect, useState } from 'react';
import { useAppointments } from '../context/AppointmentContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, LogOut, Settings, List, Grid } from 'lucide-react';
import AppointmentCalendar from '../components/AppointmentCalendar';
import ThemeToggle from '../components/ThemeToggle';
import api from '../api/axios';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { appointments } = useAppointments();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' | 'calendar'
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/doctor/profile');
                const profile = response.data;

                // If availability is empty, redirect to setup
                if (!profile.availability || profile.availability.length === 0) {
                    navigate('/doctor/setup');
                    return;
                }

                setDoctor(profile);
            } catch (error) {
                console.error("Failed to fetch profile:", error);
                // navigate('/login'); // Optional: redirect to login on error
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            localStorage.removeItem('user');
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 transition-colors duration-300">
            {/* Sidebar (simplified for mobile responsiveness) could go here */}

            {/* Main Content */}
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Welcome back, <span className="font-semibold text-blue-600 dark:text-blue-400">{doctor?.name}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button
                            onClick={() => navigate('/doctor/setup')}
                            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                            title="Edit Profile"
                        >
                            <Settings size={24} />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={24} />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-zinc-800 overflow-hidden border-2 border-white dark:border-zinc-700 shadow-sm flex items-center justify-center">
                            {doctor?.image && !imageError ? (
                                <img
                                    src={doctor.image}
                                    alt={doctor.name}
                                    className="w-full h-full object-cover"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                                    {doctor?.name?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Appointments</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{appointments.length}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Patients</p>
                                {/* Calculate unique patients from appointments */}
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {[...new Set(appointments.map(a => a.patientId?._id))].length}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Slot</p>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {/* Sort appointments and pick first upcoming, or just "N/A" if empty */}
                                    {appointments.length > 0 ? (appointments[0]?.time || "N/A") : "N/A"}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Appointments List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Today's Appointments</h2>
                            <div className="flex bg-gray-100 dark:bg-zinc-700 p-1 rounded-lg">
                                <button
                                    onClick={() => setView('list')}
                                    className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white dark:bg-zinc-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => setView('calendar')}
                                    className={`p-1.5 rounded-md transition-colors ${view === 'calendar' ? 'bg-white dark:bg-zinc-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    <Grid size={18} />
                                </button>
                            </div>
                        </div>

                        {view === 'list' ? (
                            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
                                {appointments.length > 0 ? appointments.map((appt) => (
                                    <div key={appt._id} className="p-4 border-b border-gray-100 dark:border-zinc-700 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400">
                                                    {appt.patientId?.name?.charAt(0) || "P"}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                        {appt.patientId?.name || "Unknown Patient"}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{appt.symptoms || "General Checkup"}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900 dark:text-white">{appt.time}</p>
                                                <span className={`text-xs font-medium px-2 py-1 rounded ${appt.status === "confirmed"
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                    }`}>
                                                    {appt.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No appointments scheduled.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <AppointmentCalendar appointments={appointments} userRole="doctor" />
                        )}
                    </div>

                    {/* Availability Preview */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Availability</h2>
                        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6">
                            <ul className="space-y-4">
                                {doctor?.availability?.slice(0, 5).map((av, idx) => (
                                    <li key={idx} className="flex justify-between items-start text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{av.day}</span>
                                        <div className="text-right text-gray-500 dark:text-gray-400 space-y-1">
                                            {av.slots.map((s, sIdx) => (
                                                <div key={sIdx}>{s}</div>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => navigate('/doctor/setup')}
                                className="w-full mt-6 py-2 px-4 border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                            >
                                Edit Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
