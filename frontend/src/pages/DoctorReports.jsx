import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, FileText, Calendar, ChevronRight, X } from 'lucide-react';
import { fetchDoctorReports, selectReports } from '../redux/slices/reportSlice';
import { downloadReportPDF } from '../utils/pdfGenerator';
import ThemeToggle from '../components/ThemeToggle';
import api from '../api/axios';

const DoctorReports = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const reports = useSelector(selectReports);
    const { loading } = useSelector(state => state.reports);
    const [selectedPatient, setSelectedPatient] = useState(null); // If null, show list of patients. If set, show reports for that patient.

    // We need doctor ID to fetch reports
    const [doctor, setDoctor] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/doctor/profile');
                setDoctor(response.data);
                if (response.data?._id) {
                    dispatch(fetchDoctorReports(response.data._id));
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            }
        };
        fetchProfile();
    }, [dispatch]);

    // Group reports by Patient
    const patientsMap = {};
    reports.forEach(report => {
        const pId = report.patientId?._id;
        if (!pId) return;

        if (!patientsMap[pId]) {
            patientsMap[pId] = {
                info: report.patientId,
                reports: [],
                lastReportDate: new Date(report.createdAt)
            };
        }
        patientsMap[pId].reports.push(report);
        // Update last report date if newer
        const rDate = new Date(report.createdAt);
        if (rDate > patientsMap[pId].lastReportDate) {
            patientsMap[pId].lastReportDate = rDate;
        }
    });

    const patients = Object.values(patientsMap);

    if (loading && !doctor) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 transition-colors p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => selectedPatient ? setSelectedPatient(null) : navigate(-1)}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <ArrowLeft className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {selectedPatient ? `Reports: ${selectedPatient.info.name}` : "Patient Reports"}
                        </h1>
                    </div>
                    <ThemeToggle />
                </div>

                {!selectedPatient ? (
                    /* Level 1: List of Patients */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {patients.length > 0 ? patients.map((p) => (
                            <div
                                key={p.info._id}
                                onClick={() => setSelectedPatient(p)}
                                className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 hover:border-blue-500 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-lg">
                                        {p.info.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 transition-colors">{p.info.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{p.reports.length} Reports</p>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 border-t border-gray-100 dark:border-zinc-700 pt-4 flex justify-between items-center">
                                    <span>Last Report: {p.lastReportDate.toLocaleDateString()}</span>
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No reports generated yet.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Level 2: List of Reports for Selected Patient */
                    <div className="space-y-6">
                        {selectedPatient.reports.map((report) => (
                            <div key={report._id} className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <Calendar size={16} />
                                        {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <button
                                        onClick={() => downloadReportPDF(report)}
                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                                    >
                                        <FileText size={16} /> Download PDF
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Diagnosis</h4>
                                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{report.diagnosis}</p>
                                    </div>

                                    {report.prescriptions && report.prescriptions.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Prescriptions</h4>
                                            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-700">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400">
                                                        <tr>
                                                            <th className="px-4 py-2 font-medium">Medicine</th>
                                                            <th className="px-4 py-2 font-medium">Frequency</th>
                                                            <th className="px-4 py-2 font-medium">Duration</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                                                        {report.prescriptions.map((p, idx) => (
                                                            <tr key={idx}>
                                                                <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{p.medicine}</td>
                                                                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{p.frequency}</td>
                                                                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{p.duration || "-"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorReports;
