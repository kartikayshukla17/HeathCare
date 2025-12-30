import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const AppointmentCalendar = ({ appointments, userRole }) => {

    // Transform appointments to FullCalendar events
    const events = appointments.map(appt => {
        // Parse "09:00-10:00" string
        // Assuming appt.date is "YYYY-MM-DD" and appt.time is "HH:mm" or range

        let startStr = '';
        let endStr = '';

        if (appt.time && appt.date) {
            const timeParts = appt.time.split('-');
            const startTime = timeParts[0].trim(); // "09:00"
            const endTime = timeParts[1] ? timeParts[1].trim() : null; // "10:00" or null

            // Handle date format (YYYY-MM-DD or ISO string)
            let dateStr = appt.date;
            if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            }

            startStr = `${dateStr}T${startTime}:00`;
            if (endTime) {
                endStr = `${dateStr}T${endTime}:00`;
            } else {
                // Default to 1 hour if no end time or just single time point
                // Actually fullcalendar handles "start" only fine
            }
        }

        // Color coding
        let backgroundColor = '#3b82f6'; // blue-500 default
        if (appt.status === 'completed') backgroundColor = '#10b981'; // green-500
        else if (appt.status === 'cancelled') backgroundColor = '#ef4444'; // red-500
        else if (appt.status === 'pending') backgroundColor = '#eab308'; // yellow-500

        // Title logic
        // Title logic
        let title = 'Appointment';
        if (userRole === 'patient') {
            title = `Dr. ${appt.doctorName || 'Unknown'} (${appt.type || 'Checkup'})`;
        } else {
            // For doctor: show Patient Name
            const patientName = appt.patientId?.name || appt.patientName || 'Unknown Patient';
            title = `${patientName} (${appt.symptoms || 'Checkup'})`;
        }

        return {
            id: appt._id || appt.id,
            title: title,
            start: startStr,
            end: endStr,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor,
            extendedProps: {
                status: appt.status,
                description: appt.symptoms || appt.type
            }
        };
    });

    return (
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700">
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                height="auto" // Adapts to container
                aspectRatio={1.5}
            />
        </div>
    );
};

export default AppointmentCalendar;
