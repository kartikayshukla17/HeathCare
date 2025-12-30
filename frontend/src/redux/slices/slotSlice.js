import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchSlotStatus = createAsyncThunk(
    "slots/fetchStatus",
    async ({ doctorId, date }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/appointments/slots?doctorId=${doctorId}&date=${date}`);
            return response.data; // { "09:00-10:00": 3, ... }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch slots");
        }
    }
);

const initialState = {
    slotCounts: {},
    loading: false,
    error: null,
};

const slotSlice = createSlice({
    name: "slots",
    initialState,
    reducers: {
        clearSlots: (state) => {
            state.slotCounts = {};
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSlotStatus.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSlotStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.slotCounts = action.payload;
            })
            .addCase(fetchSlotStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearSlots } = slotSlice.actions;

// Helper to determine slot color
export const getSlotColor = (slot, count) => {
    // Logic from SlotContext
    // > 4 seats: Green
    // 3-4 seats: Yellow
    // 1-2 seats: Red
    // < 1 (0): Full/Grey

    // Total capacity 6
    // Available = 6 - count
    const available = 6 - (count || 0);

    if (available <= 0) return "bg-gray-300 text-gray-500 cursor-not-allowed";
    if (available > 4) return "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
    if (available >= 3) return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200";
    return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
};

export const isSlotFull = (count) => {
    return (count || 0) >= 6;
};

export default slotSlice.reducer;
