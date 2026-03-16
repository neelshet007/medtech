export const ORDER_STATUS_OPTIONS = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Completed",
  "Cancelled",
];

const allowedTransitions = {
  Pending: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered", "Cancelled"],
  Delivered: ["Completed"],
  Completed: [],
  Cancelled: [],
};

export function createTimelineEntry(status, description) {
  return {
    status,
    date: new Date(),
    description: description || `Order marked as ${status}`,
  };
}

export function validateOrderTransition(currentStatus, nextStatus) {
  if (!ORDER_STATUS_OPTIONS.includes(nextStatus)) {
    return { error: "Invalid order status." };
  }

  if (currentStatus === nextStatus) {
    return { data: [nextStatus] };
  }

  const allowed = allowedTransitions[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    return { error: `Invalid order transition from ${currentStatus} to ${nextStatus}.` };
  }

  // Business rule:
  // once an order is delivered, the system immediately closes it as completed.
  // We keep both events in the timeline for auditability, but the final persisted state becomes Completed.
  if (nextStatus === "Delivered") {
    return { data: ["Delivered", "Completed"] };
  }

  return { data: [nextStatus] };
}
