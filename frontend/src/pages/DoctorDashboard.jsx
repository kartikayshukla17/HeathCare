import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, LogOut, Settings, List, Grid, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import AppointmentCalendar from '../components/AppointmentCalendar';
import ThemeToggle from '../components/ThemeToggle';
import { HealthMetricCard, ActionButton } from '../components/DashboardWidgets';
import api from '../api/axios';
import { fetchAppointments, selectAppointments, cancelAppointment, cancelAllAppointments } from '../redux/slices/appointmentSlice';
import { logoutUser } from '../redux/slices/authSlice';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Select appointments from Redux
    const rawAppointments = useSelector(selectAppointments);
    const appointments = Array.isArray(rawAppointments) ? rawAppointments : [];
    const { loading: apptLoading } = useSelector(state => state.appointments);

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true); // Profile loading
    const [view, setView] = useState('list'); // 'list' | 'calendar'
    const [imageError, setImageError] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        dispatch(fetchAppointments());
    }, [dispatch]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/doctor/profile');
                const profile = response.data;

                if (!profile.availability || profile.availability.length === 0) {
                    navigate('/doctor/setup');
                    return;
                }

                setDoctor(profile);
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/login');
    };

    const handleCancel = async (apptId) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

        try {
            await dispatch(cancelAppointment(apptId)).unwrap();
            alert("Appointment cancelled successfully");
        } catch (error) {
            console.error("Cancellation failed", error);
            alert(error || "Failed to cancel appointment");
        }
    };

    const handleCancelAll = async () => {
        if (!window.confirm("WARNING: This will cancel ALL pending and confirmed appointments. Are you sure?")) return;

        setProcessing(true);
        try {
            await dispatch(cancelAllAppointments()).unwrap();
            alert("All appointments cancelled successfully");
        } catch (error) {
            console.error("Cancel All failed", error);
            alert(error || "Failed to cancel all appointments");
        } finally {
            setProcessing(false);
        }
    };

    if (loading || apptLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Calculate Stats
    // Calculate Stats
    const totalPatients = [...new Set(appointments.map(a => a.patientId?._id))].length;

    // Logic to find Next Active Slot
    const getNextSlot = () => {
        if (!appointments || appointments.length === 0) return "N/A";

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        // Filter out cancelled and past dates
        // Note: Backend sorts appointments by Date ASC.
        const upcoming = appointments.filter(appt => {
            if (appt.status === 'cancelled') return false;

            const apptDate = new Date(appt.date);
            // We include today's appointments
            return apptDate >= now;
        });

        return upcoming.length > 0 ? upcoming[0].time : "N/A";
    };

    const nextSlot = getNextSlot();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 transition-colors duration-300 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <HealthMetricCard
                        title="Total Appointments"
                        value={appointments.length}
                        unit=""
                        icon={Calendar}
                        color="bg-blue-500"
                    />
                    <HealthMetricCard
                        title="Total Patients"
                        value={totalPatients}
                        unit=""
                        icon={Users}
                        color="bg-purple-500"
                    />
                    <HealthMetricCard
                        title="Next Slot"
                        value={nextSlot}
                        unit=""
                        icon={Clock}
                        color="bg-emerald-500"
                    />
                </div>

                {/* Main Content */}
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
                                                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                                                    {appt.patientId?.name?.charAt(0) || "P"}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                        {appt.patientId?.name || "Unknown Patient"}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{appt.symptoms || "General Checkup"}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <p className="font-bold text-gray-900 dark:text-white text-lg">{appt.time}</p>
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${appt.status === "confirmed"
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : appt.status === "cancelled"
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                    }`}>
                                                    {appt.status}
                                                </span>
                                                {appt.status !== 'cancelled' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCancel(appt._id); }}
                                                        className="text-xs text-red-500 hover:underline mt-1"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                                        <Calendar size={48} className="mb-4 opacity-20" />
                                        <p>No appointments scheduled for today.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <AppointmentCalendar appointments={appointments} userRole="doctor" />
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <ActionButton
                                icon={Settings}
                                label="Edit Schedule"
                                onClick={() => navigate('/doctor/setup')}
                            />
                            <ActionButton
                                icon={AlertTriangle}
                                label="Cancel All"
                                onClick={handleCancelAll}
                                colorClass="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400"
                            />
                        </div>

                        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Upcoming Schedule</h3>
                            <ul className="space-y-4">
                                {doctor?.availability?.slice(0, 3).map((av, idx) => (
                                    <li key={idx} className="pb-4 border-b border-gray-50 dark:border-zinc-700 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{av.day}</span>
                                            <span className="text-xs text-gray-400">{av.slots.length} Slots</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {av.slots.slice(0, 3).map((s, sIdx) => (
                                                <span key={sIdx} className="text-xs bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{s}</span>
                                            ))}
                                            {av.slots.length > 3 && (
                                                <span className="text-xs bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded text-gray-500">+{av.slots.length - 3}</span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
