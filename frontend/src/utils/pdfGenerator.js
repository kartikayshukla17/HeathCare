import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to add hospital header
const addHospitalHeader = (doc) => {
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("MedCare Hospital", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("123 Health Street, Wellness City, 10001", 14, 26);
    doc.text("Phone: (555) 123-4567 | Email: contact@medcare.com", 14, 31);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 36, 196, 36);
};

export const downloadReportPDF = (report) => {
    const doc = new jsPDF();

    // Header
    addHospitalHeader(doc);

    // Report Title
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Medical Report", 105, 50, { align: 'center' });

    // Details Section
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);

    const startY = 65;
    const lineHeight = 7;

    doc.text(`Patient Name: ${report.patientId?.name || "N/A"}`, 14, startY);
    doc.text(`Doctor Name: Dr. ${report.doctorId?.name || "N/A"}`, 14, startY + lineHeight);
    doc.text(`Specialization: ${report.doctorId?.specialization || "General"}`, 14, startY + lineHeight * 2);
    doc.text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`, 140, startY);
    doc.text(`Time: ${new Date(report.createdAt).toLocaleTimeString()}`, 140, startY + lineHeight);

    // Diagnosis
    doc.setFillColor(240, 248, 255);
    doc.rect(14, startY + lineHeight * 3.5, 182, 20, 'F');

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Diagnosis:", 16, startY + lineHeight * 4.5);
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(report.diagnosis || "No diagnosis provided.", 16, startY + lineHeight * 6);

    // Prescriptions Table
    if (report.prescriptions && report.prescriptions.length > 0) {
        autoTable(doc, {
            startY: startY + lineHeight * 8,
            head: [['Medicine', 'Frequency', 'Duration']],
            body: report.prescriptions.map(p => [p.medicine, p.frequency, p.duration || '-']),
            headStyles: { fillColor: [0, 102, 204] },
            theme: 'grid',
        });
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("This is a computer-generated report.", 105, pageHeight - 10, { align: 'center' });

    doc.save(`Report_${report.patientId?.name || 'Patient'}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const downloadAppointmentSlip = (appointment) => {
    const doc = new jsPDF();
    addHospitalHeader(doc);

    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Appointment Slip", 105, 50, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);

    doc.text(`Appointment ID: #${appointment._id?.slice(-6).toUpperCase()}`, 14, 70);
    doc.text(`Patient: ${appointment.patientId?.name || appointment.patientName || "N/A"}`, 14, 80);
    doc.text(`Doctor: Dr. ${appointment.doctorId?.name || appointment.doctorName || "N/A"}`, 14, 90);
    doc.text(`Date: ${new Date(appointment.date).toDateString()}`, 14, 100);
    doc.text(`Time: ${appointment.time}`, 14, 110);
    doc.text(`Status: ${appointment.status.toUpperCase()}`, 14, 120);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Please arrive 15 minutes prior to your scheduled time.", 14, 140);

    doc.save(`Appointment_${appointment._id?.slice(-6)}.pdf`);
};

export const downloadPaymentReceipt = (appointment) => {
    const doc = new jsPDF();
    addHospitalHeader(doc);

    const isPaid = appointment.paymentStatus === 'Paid';
    const statusText = isPaid ? 'PAID' : 'PENDING';
    const statusColor = isPaid ? [0, 100, 0] : [200, 100, 0]; // Green or Orange

    doc.setFontSize(16);
    doc.setTextColor(...statusColor);
    doc.text(`Payment Receipt (${statusText})`, 105, 50, { align: 'center' });

    const startY = 70;

    autoTable(doc, {
        startY: startY,
        head: [['Description', 'Amount']],
        body: [
            ['Consultation Fee', `Rs. ${appointment.amount || 500}`], // Assuming 500 if not present
            ['Platform Fee', 'Rs. 0'],
            ['Total Amount', `Rs. ${appointment.amount || 500}`]
        ],
        foot: [['Payment Status', `${statusText} (${appointment.paymentMethod})`]],
        theme: 'striped',
        headStyles: { fillColor: isPaid ? [46, 139, 87] : [255, 140, 0] }
    });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Receipt ID: R-${appointment._id?.slice(-8)}`, 14, startY + 50);
    doc.text(`Date: ${new Date(appointment.createdAt).toLocaleDateString()}`, 14, startY + 55);

    // Only show "Paid at" if it is actually paid, otherwise "Booked on"
    const timeLabel = isPaid ? "Paid at" : "Booked at";
    doc.text(`${timeLabel}: ${new Date(appointment.createdAt).toLocaleTimeString()}`, 14, startY + 60);

    doc.save(`Receipt_${appointment._id?.slice(-6)}.pdf`);
};
