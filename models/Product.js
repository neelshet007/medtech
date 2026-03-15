import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide product name"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide product description"],
    },
    price: {
      type: Number,
      required: [true, "Please provide product price"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Please provide product category"],
      enum: ["Medicine", "Equipment", "Supplement", "Personal Care"],
    },
    stock: {
      type: Number,
      required: [true, "Please provide product stock"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    imageUrl: {
      // We will store Cloudinary URLs here
      type: String,
      required: false, 
    },
    requiresPrescription: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Add text indexing on name and description for search functionality
productSchema.index({ name: 'text', description: 'text' });
// Add normal index on category for faster filtering
productSchema.index({ category: 1 });

export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
