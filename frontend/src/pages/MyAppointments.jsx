import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, AlertCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { fetchAppointments, selectAppointments, cancelAppointment } from '../redux/slices/appointmentSlice';

const MyAppointments = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const appointments = useSelector(selectAppointments);
    const { loading } = useSelector(state => state.appointments);

    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'history'
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        dispatch(fetchAppointments());
    }, [dispatch]);

    const handleCancel = async (appt) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

        setCancellingId(appt._id);
        try {
            const result = await dispatch(cancelAppointment(appt._id)).unwrap();
            const { refundPercentage, refundAmount, message } = result;

            alert(`${message}\nRefund: ${refundPercentage}% (₹${refundAmount})`);
        } catch (error) {
            console.error("Cancellation failed", error);
            alert(error || "Failed to cancel appointment");
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const currentList = activeTab === 'upcoming'
        ? (appointments.upcoming || [])
        : (appointments.history || []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 transition-colors p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <ArrowLeft className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
                    </div>
                    <ThemeToggle />
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-1 mb-8 flex">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'upcoming' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
                    >
                        History
                    </button>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {currentList.length > 0 ? currentList.map(appt => (
                        <div key={appt._id} className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:border-blue-500 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 font-bold text-xl">
                                    {new Date(appt.date).getDate()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                        {appt.doctorName || "Dr. Unknown"}
                                    </h3>
                                    <p className="text-blue-600 dark:text-blue-400 text-sm mb-2">{appt.type || "Checkup"}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(appt.date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {appt.time}
                                        </div>
                                    </div>
                                    {appt.amount && (
                                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            Fee: ₹{appt.amount}
                                            {appt.status === 'cancelled' && appt.refundAmount !== undefined && (
                                                <span className="ml-2 text-green-600 font-medium">
                                                    (Refunded: ₹{appt.refundAmount})
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${appt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                        appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {appt.status}
                                </span>
                                {activeTab === 'upcoming' && appt.status !== 'cancelled' && (
                                    <button
                                        onClick={() => handleCancel(appt)}
                                        disabled={cancellingId === appt._id}
                                        className="text-sm text-red-500 hover:text-red-700 hover:underline mt-2 disabled:opacity-50"
                                    >
                                        {cancellingId === appt._id ? "Processing..." : "Cancel Appointment"}
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12">
                            <div className="bg-gray-100 dark:bg-zinc-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Appointments</h3>
                            <p className="text-gray-500 dark:text-gray-400">You don't have any appointments in this list.</p>
                            {activeTab === 'upcoming' && (
                                <button
                                    onClick={() => navigate('/book-appointment')}
                                    className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Book Now
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyAppointments;
