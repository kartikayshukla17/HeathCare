import React from 'react';
import { Heart, Activity, Droplets, Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';

export const HealthMetricCard = ({ title, value, unit, icon: Icon, color, trend }) => (
    <div className={`bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 hover:shadow-md transition-all group`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
            {trend && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {value} <span className="text-sm text-gray-400 font-normal">{unit}</span>
            </h3>
        </div>
    </div>
);

export const AppointmentCard = ({ doctorName, specialty, date, time, image, onClick }) => (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/30 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform" onClick={onClick}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>

        <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Upcoming Appointment</p>
                    <h3 className="text-2xl font-bold">{doctorName}</h3>
                    <p className="text-blue-100">{specialty}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Calendar size={20} className="text-white" />
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/30 rounded-lg">
                        <Clock size={16} />
                    </div>
                    <div>
                        <p className="text-xs text-blue-100">Date & Time</p>
                        <p className="font-bold text-sm">{date} at {time}</p>
                    </div>
                </div>
                <div className="h-8 w-[1px] bg-white/20"></div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/30 rounded-lg">
                        <div className="w-4 h-4 rounded-full bg-green-400 border-2 border-transparent"></div>
                    </div>
                    <div>
                        <p className="text-xs text-blue-100">Status</p>
                        <p className="font-bold text-sm">Confirmed</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const ActionButton = ({ icon: Icon, label, onClick, colorClass = "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white" }) => (
    <button
        onClick={onClick}
        className={`${colorClass} p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all hover:border-blue-500 group h-32 w-full`}
    >
        <div className="p-3 bg-gray-50 dark:bg-zinc-700 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
            <Icon size={24} className="text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
        </div>
        <span className="font-medium text-sm">{label}</span>
    </button>
);
