import mongoose from "mongoose";

const healthReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Report title is required"],
      trim: true,
    },
    fileUrl: {
      // Cloudinary PDF or Image URL
      type: String,
      required: [true, "Report file is required"],
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },
    // For storing extracted metrics (e.g. for Recharts graphs later)
    metrics: {
      bloodPressureSys: Number,
      bloodPressureDia: Number,
      heartRate: Number,
      sugarLevel: Number,
    },
  },
  { timestamps: true }
);

// Indexing for querying reports specific to a user
healthReportSchema.index({ user: 1 });

export const HealthReport = mongoose.models.HealthReport || mongoose.model("HealthReport", healthReportSchema);
