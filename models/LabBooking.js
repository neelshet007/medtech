import mongoose from "mongoose";

const labBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabService",
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    prescriptionUrl: {
      type: String,
      default: "",
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

export const LabBooking = mongoose.models.LabBooking || mongoose.model("LabBooking", labBookingSchema);
