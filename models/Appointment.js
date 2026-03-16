import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Booked", "Confirmed", "Completed", "Cancelled"],
      default: "Booked",
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, timeSlot: 1 }, { unique: true });

export const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
