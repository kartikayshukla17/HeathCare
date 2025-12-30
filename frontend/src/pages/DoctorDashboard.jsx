import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, LogOut, Settings, List, Grid, CheckCircle, XCircle, Trash2, AlertTriangle, FileText, Plus, X, Eye } from 'lucide-react';
import AppointmentCalendar from '../components/AppointmentCalendar';
import ThemeToggle from '../components/ThemeToggle';
import { HealthMetricCard, ActionButton } from '../components/DashboardWidgets';
import api from '../api/axios';
import { fetchAppointments, selectAppointments, cancelAppointment, cancelAllAppointments } from '../redux/slices/appointmentSlice';
import { logoutUser } from '../redux/slices/authSlice';
import { generateReport, fetchDoctorReports, selectReports } from '../redux/slices/reportSlice';
import { downloadReportPDF } from '../utils/pdfGenerator';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Select appointments from Redux
    const rawAppointments = useSelector(selectAppointments);
    const appointments = Array.isArray(rawAppointments) ? rawAppointments : [];
    const { loading: apptLoading } = useSelector(state => state.appointments);
    const reports = useSelector(selectReports);

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true); // Profile loading
    const [view, setView] = useState('list'); // 'list' | 'calendar'
    const [imageError, setImageError] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Report Modal State
    const [showReportModal, setShowReportModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'view'
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [diagnosis, setDiagnosis] = useState("");
    const [prescriptions, setPrescriptions] = useState([{ medicine: "", frequency: "Once", duration: "" }]);

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
                // Fetch reports for this doctor to know which appts have reports
                if (profile._id) {
                    dispatch(fetchDoctorReports(profile._id));
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate, dispatch]);

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

    // Report Handlers
    const openGenerateReport = (appt) => {
        setSelectedAppt(appt);
        setModalMode('create');
        setDiagnosis("");
        setPrescriptions([{ medicine: "", frequency: "Once", duration: "" }]);
        setShowReportModal(true);
    };

    const openViewReport = (appt) => {
        const report = reports.find(r => (r.appointmentId?._id === appt._id) || (r.appointmentId === appt._id));
        if (!report) return;

        setSelectedAppt(appt);
        setModalMode('view');
        setDiagnosis(report.diagnosis);
        setPrescriptions(report.prescriptions || []);
        setShowReportModal(true);
    };

    const handlePrescriptionChange = (index, field, value) => {
        if (modalMode === 'view') return;
        const newPrescriptions = [...prescriptions];
        newPrescriptions[index][field] = value;
        setPrescriptions(newPrescriptions);
    };

    const addPrescriptionRow = () => {
        if (modalMode === 'view') return;
        setPrescriptions([...prescriptions, { medicine: "", frequency: "Once", duration: "" }]);
    };

    const removePrescriptionRow = (index) => {
        if (modalMode === 'view') return;
        const newPrescriptions = prescriptions.filter((_, i) => i !== index);
        setPrescriptions(newPrescriptions);
    };

    const handleSubmitReport = async () => {
        if (modalMode === 'view') {
            setShowReportModal(false);
            return;
        }

        if (!diagnosis.trim()) {
            alert("Diagnosis is required");
            return;
        }

        // Filter out empty prescriptions
        const validPrescriptions = prescriptions.filter(p => p.medicine.trim() !== "");

        const reportData = {
            appointmentId: selectedAppt._id,
            doctorId: doctor._id,
            patientId: selectedAppt.patientId._id,
            diagnosis,
            prescriptions: validPrescriptions
        };

        try {
            await dispatch(generateReport(reportData)).unwrap();
            alert("Report generated successfully!");
            setShowReportModal(false);
            // Refresh reports
            dispatch(fetchDoctorReports(doctor._id));
        } catch (error) {
            console.error("Failed to generate report", error);
            alert(error || "Failed to generate report");
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
    const totalPatients = [...new Set(appointments.map(a => a.patientId?._id))].length;

    const getNextSlot = () => {
        if (!appointments || appointments.length === 0) return "N/A";
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const upcoming = appointments.filter(appt => {
            if (appt.status === 'cancelled') return false;
            const apptDate = new Date(appt.date);
            return apptDate >= now;
        });
        return upcoming.length > 0 ? upcoming[0].time : "N/A";
    };
    const nextSlot = getNextSlot();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 transition-colors duration-300 p-4 sm:p-8 relative">
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
                        <button onClick={() => navigate('/doctor/setup')} className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                            <Settings size={24} />
                        </button>
                        <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
                            <LogOut size={24} />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-zinc-800 overflow-hidden border-2 border-white dark:border-zinc-700 shadow-sm flex items-center justify-center">
                            {doctor?.image && !imageError ? (
                                <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" onError={() => setImageError(true)} />
                            ) : (
                                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{doctor?.name?.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <HealthMetricCard title="Total Appointments" value={appointments.length} unit="" icon={Calendar} color="bg-blue-500" />
                    <HealthMetricCard title="Total Patients" value={totalPatients} unit="" icon={Users} color="bg-purple-500" />
                    <HealthMetricCard title="Next Slot" value={nextSlot} unit="" icon={Clock} color="bg-emerald-500" />
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Appointments List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Today's Appointments</h2>
                            <div className="flex bg-gray-100 dark:bg-zinc-700 p-1 rounded-lg">
                                <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white dark:bg-zinc-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    <List size={18} />
                                </button>
                                <button onClick={() => setView('calendar')} className={`p-1.5 rounded-md transition-colors ${view === 'calendar' ? 'bg-white dark:bg-zinc-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    <Grid size={18} />
                                </button>
                            </div>
                        </div>

                        {view === 'list' ? (
                            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
                                {appointments.length > 0 ? appointments.map((appt) => {
                                    const hasReport = reports.some(r => (r.appointmentId?._id === appt._id) || (r.appointmentId === appt._id));

                                    return (
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
                                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${appt.status === "confirmed" ? "bg-green-100 text-green-700" : appt.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                                        {appt.status}
                                                    </span>

                                                    {/* Report Actions */}
                                                    {(appt.status === 'confirmed' || appt.status === 'pending') && (
                                                        <>
                                                            {hasReport ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); openViewReport(appt); }}
                                                                    className="text-xs text-emerald-600 hover:underline mt-1 flex items-center gap-1 font-medium"
                                                                >
                                                                    <Eye size={12} /> View Report
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); openGenerateReport(appt); }}
                                                                    className="text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1"
                                                                >
                                                                    <FileText size={12} /> Generate Report
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleCancel(appt._id); }} className="text-xs text-red-500 hover:underline mt-1">
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }) : (
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
                            <ActionButton icon={Settings} label="Edit Schedule" onClick={() => navigate('/doctor/setup')} />
                            <ActionButton icon={FileText} label="My Reports" onClick={() => navigate('/doctor/reports')} colorClass="bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30 text-purple-600 dark:text-purple-400" />
                            <ActionButton icon={AlertTriangle} label="Cancel All" onClick={handleCancelAll} colorClass="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400" />
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
                                            {av.slots.length > 3 && <span className="text-xs bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded text-gray-500">+{av.slots.length - 3}</span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generate/View Report Modal */}
            {showReportModal && selectedAppt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {modalMode === 'view' ? 'View Medical Report' : 'Generate Medical Report'}
                            </h3>
                            <div className="flex items-center gap-2">
                                {modalMode === 'view' && (
                                    <button
                                        onClick={() => downloadReportPDF(reports.find(r => r.appointmentId?._id === selectedAppt._id || r.appointmentId === selectedAppt._id))}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mr-2"
                                    >
                                        <FileText size={16} /> Download
                                    </button>
                                )}
                                <button onClick={() => setShowReportModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Patient Info */}
                            <div className="flex items-center gap-4 mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300">
                                    {selectedAppt.patientId?.name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Patient</p>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{selectedAppt.patientId?.name}</h4>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedAppt.date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Diagnosis */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Diagnosis</label>
                                <textarea
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    readOnly={modalMode === 'view'}
                                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none ${modalMode === 'view' ? 'bg-gray-100 dark:bg-zinc-800' : 'bg-gray-50 dark:bg-zinc-800'}`}
                                    placeholder={modalMode === 'create' ? "Enter detailed diagnosis..." : ""}
                                ></textarea>
                            </div>

                            {/* Prescriptions */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prescriptions</label>
                                    {modalMode === 'create' && (
                                        <button onClick={addPrescriptionRow} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                            <Plus size={16} /> Add Medicine
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {prescriptions.map((presc, index) => (
                                        <div key={index} className="flex gap-2 items-start">
                                            <input
                                                type="text"
                                                placeholder="Medicine Name"
                                                value={presc.medicine}
                                                readOnly={modalMode === 'view'}
                                                onChange={(e) => handlePrescriptionChange(index, 'medicine', e.target.value)}
                                                className={`flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none ${modalMode === 'view' ? 'bg-gray-100 dark:bg-zinc-800' : 'bg-gray-50 dark:bg-zinc-800'}`}
                                            />
                                            <select
                                                value={presc.frequency}
                                                disabled={modalMode === 'view'}
                                                onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                                                className={`w-32 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none ${modalMode === 'view' ? 'bg-gray-100 dark:bg-zinc-800 appearance-none' : 'bg-gray-50 dark:bg-zinc-800'}`}
                                            >
                                                <option value="Once">Once</option>
                                                <option value="Twice">Twice</option>
                                                <option value="Thrice">Thrice</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Duration"
                                                value={presc.duration}
                                                readOnly={modalMode === 'view'}
                                                onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                                                className={`w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none ${modalMode === 'view' ? 'bg-gray-100 dark:bg-zinc-800' : 'bg-gray-50 dark:bg-zinc-800'}`}
                                            />
                                            {modalMode === 'create' && (
                                                <button
                                                    onClick={() => removePrescriptionRow(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {prescriptions.length === 0 && modalMode === 'view' && (
                                        <p className="text-gray-500 text-sm italic">No prescriptions.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3 bg-gray-50 dark:bg-zinc-800/50">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                {modalMode === 'view' ? 'Close' : 'Cancel'}
                            </button>
                            {modalMode === 'create' && (
                                <button
                                    onClick={handleSubmitReport}
                                    className="px-5 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all"
                                >
                                    Submit Report
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;
