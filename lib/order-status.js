export const ORDER_STATUS_OPTIONS = [
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

export function createTimelineEntry(status, description) {
  return {
    status,
    date: new Date(),
    description: description || `Order marked as ${status}`,
  };
}
