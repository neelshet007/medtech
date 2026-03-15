import mongoose from "mongoose";

// ==========================================
// STRICT ADMIN ISOLATION (PHASE 10)
// ==========================================
// Why a separate model? 
// If Admins and Patients share the `User.js` collection, an attacker who finds
// a vulnerability in the patient registration route might be able to inject
// `role: "admin"` into the payload. By physically separating the collections
// at the database level, privilege escalation from patient to admin is structurally impossible.
const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Admin name is required"],
    },
    email: {
      type: String,
      required: [true, "Admin email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Admin password is required"],
      select: false, // Security: Never return password hash in regular queries
    },
    role: {
      type: String,
      default: "admin",
      immutable: true, // Security: Role cannot be modified after creation
    },
  },
  { 
    timestamps: true 
  }
);

export const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
