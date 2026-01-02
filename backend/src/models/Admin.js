import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            default: "admin",
        },
        // phone field removed as per request
    },
    { timestamps: true }
);

const Admin = mongoose.model("Admin", AdminSchema);
export default Admin;
