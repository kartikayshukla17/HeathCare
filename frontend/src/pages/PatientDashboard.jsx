import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Calendar, Droplets, Heart, Activity, Plus, LogOut } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { HealthMetricCard, AppointmentCard, ActionButton } from '../components/DashboardWidgets';
import { fetchAppointments, selectNextAppointment } from '../redux/slices/appointmentSlice';
import { logoutUser } from '../redux/slices/authSlice';

const PatientDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user } = useSelector(state => state.auth);
    const { loading } = useSelector(state => state.appointments);

    // Select next valid appointment (ignores cancelled)
    const upcomingAppointment = useSelector(selectNextAppointment);

    useEffect(() => {
        dispatch(fetchAppointments());
    }, [dispatch]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 transition-colors p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Hello, {user?.name || 'Patient'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Here's your daily health overview.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={24} />
                        </button>
                    </div>
                </div>

                {/* Hero Section: Vitals & Next Appointment */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Next Appointment Hero */}
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Next Appointment</h2>
                        {upcomingAppointment ? (
                            <AppointmentCard
                                doctorName={upcomingAppointment.doctorName || "Dr. Unnamed"}
                                specialty={upcomingAppointment.type || "Specialist"}
                                date={new Date(upcomingAppointment.date).toDateString()}
                                time={upcomingAppointment.time}
                                onClick={() => navigate('/appointments')}
                            />
                        ) : (
                            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-zinc-700 h-64 flex flex-col items-center justify-center gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-full">
                                    <Calendar size={32} className="text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Upcoming Visits</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">Schedule a checkup to stay on top of your health.</p>
                                </div>
                                <button
                                    onClick={() => navigate('/book-appointment')}
                                    className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Book Now
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Vitals */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Vitals Status</h2>
                        <HealthMetricCard
                            title="Heart Rate"
                            value="72"
                            unit="bpm"
                            icon={Heart}
                            color="bg-red-500"
                            trend={2}
                        />
                        <HealthMetricCard
                            title="Sugar Level"
                            value="98"
                            unit="mg/dL"
                            icon={Activity}
                            color="bg-purple-500"
                            trend={-5}
                        />
                    </div>
                </div>

                {/* Actions Grid */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ActionButton
                            icon={Plus}
                            label="Book Appointment"
                            onClick={() => navigate('/book-appointment')}
                            colorClass="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
                        />
                        <ActionButton
                            icon={Calendar}
                            label="My Appointments"
                            onClick={() => navigate('/appointments')}
                        />
                        <ActionButton
                            icon={Droplets}
                            label="Log Water Info"
                            onClick={() => alert("Water Tracker Coming Soon!")}
                        />
                        <ActionButton
                            icon={Activity}
                            label="Health History"
                            onClick={() => navigate('/history')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
