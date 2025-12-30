import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Thunk to fetch reports for a patient (Patient View)
export const fetchPatientReports = createAsyncThunk(
    'reports/fetchPatientReports',
    async (patientId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/reports/patient/${patientId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch reports');
        }
    }
);

// Thunk to generate a report (Doctor View)
export const generateReport = createAsyncThunk(
    'reports/generateReport',
    async (reportData, { rejectWithValue }) => {
        try {
            const response = await api.post('/reports', reportData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to generate report');
        }
    }
);

// Thunk to fetch reports for a doctor (Doctor View)
export const fetchDoctorReports = createAsyncThunk(
    'reports/fetchDoctorReports',
    async (doctorId, { rejectWithValue }) => {
        try {
            // Using query param as defined in backend
            const response = await api.get(`/reports/doctor/me?doctorId=${doctorId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctor reports');
        }
    }
);

const reportSlice = createSlice({
    name: 'reports',
    initialState: {
        list: [],
        loading: false,
        error: null,
    },
    reducers: {
        // Action to handle real-time report addition from Socket.io
        addReportFromSocket: (state, action) => {
            // Check if report already exists to avoid duplicates
            const exists = state.list.find(r => r._id === action.payload._id);
            if (!exists) {
                state.list.unshift(action.payload); // Add new report to the top
            }
        },
        clearReports: (state) => {
            state.list = [];
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Patient Reports
            .addCase(fetchPatientReports.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPatientReports.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchPatientReports.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Generate Report (Doctor)
            .addCase(generateReport.pending, (state) => {
                state.loading = true;
            })
            .addCase(generateReport.fulfilled, (state, action) => {
                state.loading = false;
                // Optional: add to list if we are maintaining a list of generated reports
            })
            .addCase(generateReport.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Doctor Reports
            .addCase(fetchDoctorReports.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchDoctorReports.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchDoctorReports.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { addReportFromSocket, clearReports } = reportSlice.actions;

export const selectReports = (state) => state.reports.list;

export default reportSlice.reducer;
