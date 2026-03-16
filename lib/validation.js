import { normalizeBatches, normalizeReviews, sanitizeStringList, summarizeStockFromBatches, validateBatchWindow } from "@/lib/inventory";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email = "") {
  return email.toLowerCase().trim();
}

export function validatePatientRegistration(payload = {}) {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = normalizeEmail(payload.email);
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Please provide a valid email address." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  return {
    data: {
      name,
      email,
      password,
    },
  };
}

export function validateProductPayload(payload = {}) {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const description = typeof payload.description === "string" ? payload.description.trim() : "";
  const category = typeof payload.category === "string" ? payload.category.trim() : "";
  const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl.trim() : "";
  const expiryInformation = typeof payload.expiryInformation === "string" ? payload.expiryInformation.trim() : "";
  const price = Number(payload.price);
  const requiresPrescription = Boolean(payload.requiresPrescription);
  const allowedCategories = ["Medicine", "Equipment", "Supplement", "Personal Care"];
  const batches = normalizeBatches(payload.batches);
  const batchValidation = validateBatchWindow(batches);

  if (!name || !description || !category) {
    return { error: "Name, description, and category are required." };
  }

  if (!allowedCategories.includes(category)) {
    return { error: "Invalid product category." };
  }

  if (!Number.isFinite(price) || price < 0) {
    return { error: "Price must be a non-negative number." };
  }

  if (batchValidation.error) {
    return { error: batchValidation.error };
  }

  const { stock, lowStock } = summarizeStockFromBatches(batches);

  return {
    data: {
      name,
      description,
      category,
      imageUrl,
      price,
      stock,
      requiresPrescription,
      drugList: sanitizeStringList(payload.drugList),
      whenToUse: sanitizeStringList(payload.whenToUse),
      ingredients: sanitizeStringList(payload.ingredients),
      sideEffects: sanitizeStringList(payload.sideEffects),
      expiryInformation,
      reviews: normalizeReviews(payload.reviews),
      batches,
      lowStock,
    },
  };
}
