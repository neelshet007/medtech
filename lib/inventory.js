function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function monthsUntil(dateValue) {
  const date = toDate(dateValue);
  if (!date) {
    return -Infinity;
  }

  const now = new Date();
  return (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
}

export function sanitizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeReviews(reviews = []) {
  if (!Array.isArray(reviews)) {
    return [];
  }

  return reviews
    .map((review) => ({
      author: String(review.author || "").trim(),
      rating: Number(review.rating || 0),
      comment: String(review.comment || "").trim(),
    }))
    .filter((review) => review.author && review.comment && review.rating >= 1 && review.rating <= 5);
}

export function normalizeBatches(batches = []) {
  if (!Array.isArray(batches)) {
    return [];
  }

  return batches
    .map((batch) => ({
      quantity: Number(batch.quantity || 0),
      expiryDate: toDate(batch.expiryDate),
      _id: batch._id,
    }))
    .filter((batch) => batch.expiryDate && Number.isInteger(batch.quantity) && batch.quantity >= 0)
    .sort((left, right) => left.expiryDate.getTime() - right.expiryDate.getTime());
}

export function summarizeStockFromBatches(batches = []) {
  const stock = batches.reduce((total, batch) => total + batch.quantity, 0);
  return {
    stock,
    lowStock: stock < 5,
  };
}

export function validateBatchWindow(batches = []) {
  for (const batch of batches) {
    const monthsRemaining = monthsUntil(batch.expiryDate);

    if (monthsRemaining <= 3) {
      return {
        error: "Batches expiring within 3 months cannot be stored for sale.",
      };
    }
  }

  return { data: batches };
}

export function buildExpiryBuckets(batches = []) {
  const expired = [];
  const nearExpiry = [];

  for (const batch of batches) {
    const monthsRemaining = monthsUntil(batch.expiryDate);

    if (monthsRemaining <= 0) {
      expired.push(batch);
    } else if (monthsRemaining > 3 && monthsRemaining <= 6) {
      nearExpiry.push(batch);
    }
  }

  return { expired, nearExpiry };
}

export function allocateInventoryFEFO(product, quantity) {
  const normalizedBatches = normalizeBatches(product.batches || []);
  // FEFO eligibility window:
  // expired batches and batches expiring within 3 months are excluded from saleable stock.
  // This keeps the picker compliant with the business rule before any deduction happens.
  const eligibleBatches = normalizedBatches.filter((batch) => monthsUntil(batch.expiryDate) > 3 && batch.quantity > 0);
  const allocations = [];
  let remaining = quantity;

  for (const batch of eligibleBatches) {
    if (remaining === 0) {
      break;
    }

    const usedQuantity = Math.min(remaining, batch.quantity);
    if (usedQuantity > 0) {
      allocations.push({
        batchId: batch._id,
        expiryDate: batch.expiryDate,
        quantity: usedQuantity,
      });
      // FEFO means the earliest valid expiry is always consumed first.
      remaining -= usedQuantity;
    }
  }

  if (remaining > 0) {
    return {
      error: `Insufficient eligible stock for ${product.name}. FEFO skipped expired and near-expiry batches.`,
    };
  }

  return { allocations };
}

export function deductBatchAllocations(product, allocations) {
  const allocationMap = new Map(allocations.map((allocation) => [String(allocation.batchId), allocation.quantity]));

  const updatedBatches = normalizeBatches(product.batches || [])
    .map((batch) => {
      const reduction = allocationMap.get(String(batch._id)) || 0;
      return {
        ...batch,
        quantity: batch.quantity - reduction,
      };
    })
    // Empty batches are removed after deduction so the product does not retain dead inventory rows.
    .filter((batch) => batch.quantity > 0);

  const { stock, lowStock } = summarizeStockFromBatches(updatedBatches);

  product.batches = updatedBatches;
  product.stock = stock;
  product.lowStock = lowStock;
}
