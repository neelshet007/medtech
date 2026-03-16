import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const batchSchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  { _id: true }
);

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
    drugList: {
      type: [String],
      default: [],
    },
    whenToUse: {
      type: [String],
      default: [],
    },
    ingredients: {
      type: [String],
      default: [],
    },
    sideEffects: {
      type: [String],
      default: [],
    },
    expiryInformation: {
      type: String,
      default: "",
      trim: true,
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
    batches: {
      type: [batchSchema],
      default: [],
    },
    lowStock: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Add text indexing on name and description for search functionality
productSchema.index({ name: 'text', description: 'text' });
// Add normal index on category for faster filtering
productSchema.index({ category: 1 });

export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
