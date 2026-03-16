import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
  },
  price: {
    // Storing historical price at time of purchase
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Processing",
    },
    prescriptionUrl: {
      type: String,
      required: false,
    },
    trackingId: {
      type: String,
      required: false,
    },
    deliveryTimeline: [
      {
        status: {
          type: String,
          enum: ["Processing", "Shipped", "Out for Delivery", "Delivered"],
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        description: String,
      }
    ],
    // Razorpay specific fields
    razorpayOrderId: {
      type: String,
      required: false,
    },
    razorpayPaymentId: {
      type: String,
      required: false,
    },
    razorpaySignature: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Indexing for faster queries (finding orders by a specific user)
orderSchema.index({ user: 1 });
// Indexing for webhook tracking (matching an incoming razorpay id to internal id)
orderSchema.index({ razorpayOrderId: 1 });

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
