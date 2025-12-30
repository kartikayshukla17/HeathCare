import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Async Thunks
export const fetchAppointments = createAsyncThunk(
    "appointments/fetch",
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState();
            if (!auth.user) return rejectWithValue("No user logged in");

            let endpoint = "";
            if (auth.user.role === "doctor") {
                endpoint = "/doctor/appointments";
            } else if (auth.user.role === "patient") {
                endpoint = "/patient/appointments";
            }

            if (!endpoint) return rejectWithValue("Invalid Role");

            const response = await api.get(endpoint);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Fetch failed");
        }
    }
);

export const bookAppointment = createAsyncThunk(
    "appointments/book",
    async (bookingData, { rejectWithValue, dispatch }) => {
        try {
            const response = await api.post("/appointments/book", bookingData);
            dispatch(fetchAppointments()); // Refresh list
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Booking failed");
        }
    }
);

export const cancelAppointment = createAsyncThunk(
    "appointments/cancel",
    async (id, { rejectWithValue, dispatch }) => {
        try {
            const response = await api.post(`/appointments/cancel/${id}`);
            dispatch(fetchAppointments()); // Refresh list
            return response.data; // contains refund details
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Cancellation failed");
        }
    }
);

export const cancelAllAppointments = createAsyncThunk(
    "appointments/cancelAll",
    async (_, { rejectWithValue, dispatch }) => {
        try {
            const response = await api.post("/appointments/cancel-all");
            dispatch(fetchAppointments()); // Refresh list
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Cancel All failed");
        }
    }
);

const initialState = {
    list: [], // For doctors (raw array)
    patientData: { upcoming: [], history: [], today: [] }, // For patients
    loading: false,
    error: null,
};

const appointmentSlice = createSlice({
    name: "appointments",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchAppointments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAppointments.fulfilled, (state, action) => {
                state.loading = false;
                if (Array.isArray(action.payload)) {
                    state.list = action.payload;
                } else {
                    state.patientData = action.payload;
                }
            })
            .addCase(fetchAppointments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Book
            .addCase(bookAppointment.pending, (state) => {
                state.loading = true;
            })
            .addCase(bookAppointment.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(bookAppointment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

// Selectors
export const selectAppointments = (state) => {
    const { auth } = state;
    if (auth.user?.role === 'doctor') {
        return state.appointments.list || [];
    }
    if (auth.user?.role === 'patient') {
        return state.appointments.patientData;
    }
    // Default safe return to avoid crashes if role is undefined/loading
    return [];
};

// FIX: Selector to find correct next appointment (filtering cancelled)
export const selectNextAppointment = (state) => {
    const { upcoming } = state.appointments.patientData;
    if (!upcoming || upcoming.length === 0) return null;

    // Filter out cancelled and sort by date
    const validUpcoming = upcoming
        .filter(appt => appt.status !== 'cancelled')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    return validUpcoming.length > 0 ? validUpcoming[0] : null;
};

export default appointmentSlice.reducer;
