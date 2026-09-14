import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true,  trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // should be hashed
    role: { type: String, enum: ["admin", "superadmin", "subadmin"], default: "admin" },
    permissions: [{ type: String, default: ["matrimony", "matrimony_category"] }],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", AdminSchema);

export default Admin;
