import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import appointmentReducer from "./slices/appointmentSlice";
import slotReducer from "./slices/slotSlice";
import reportReducer from './slices/reportSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        appointments: appointmentReducer,
        slots: slotReducer,
        reports: reportReducer,
    },
});
