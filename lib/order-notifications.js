function postWebhook(url, payload, label) {
  if (!url) {
    return;
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((error) => {
    console.error(`${label} webhook failed:`, error);
  });
}

export function notifyAdminAboutOrder(order) {
  postWebhook(
    process.env.N8N_WEBHOOK_URL,
    {
      orderId: order._id,
      amount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      customer: order.user,
      event: order.paymentMethod === "COD" ? "order_placed_cod" : "order_paid",
    },
    "Admin"
  );
}

export function notifyCustomerAboutOrder(order) {
  postWebhook(
    process.env.N8N_CUSTOMER_WEBHOOK_URL,
    {
      orderId: order._id,
      amount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      customerName: order.user?.name || "Customer",
      customerPhone: order.user?.phone || "",
      event: order.paymentMethod === "COD" ? "order_placed_cod" : "order_paid",
    },
    "Customer"
  );
}
