import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    availableTimings: {
      type: [String],
      default: [],
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

export const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);
