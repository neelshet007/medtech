import { connectToDatabase } from "@/lib/db";
import { deductBatchAllocations, allocateInventoryFEFO } from "@/lib/inventory";
import { createTimelineEntry } from "@/lib/order-status";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";

export async function reserveInventoryForOrder(orderId, paymentStatusOverride) {
  const connection = await connectToDatabase();
  const session = await connection.startSession();

  try {
    let updatedOrder = null;

    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new Error("Order not found.");
      }

      const updatedItems = [];

      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session);
        if (!product) {
          throw new Error("Product not found for order item.");
        }

        // FEFO allocation:
        // 1. sort eligible batches by earliest expiry
        // 2. ignore expired and <=3 month batches
        // 3. consume the earliest valid batch first
        // 4. continue until quantity is satisfied
        const allocationResult = allocateInventoryFEFO(product, item.quantity);
        if (allocationResult.error) {
          throw new Error(allocationResult.error);
        }

        // Stock reduction is executed inside the same MongoDB transaction as the order update.
        // If any product fails FEFO allocation, the whole order stays untouched and no partial
        // inventory deduction leaks into the database.
        deductBatchAllocations(product, allocationResult.allocations);
        await product.save({ session });

        updatedItems.push({
          ...item.toObject(),
          batchAllocations: allocationResult.allocations,
        });
      }

      order.items = updatedItems;
      order.orderStatus = "Processing";
      order.paymentStatus = paymentStatusOverride || order.paymentStatus;
      // The order moves from Pending to Processing only after inventory is physically reserved.
      order.deliveryTimeline.push(createTimelineEntry("Processing", "Inventory reserved and order moved into processing."));

      updatedOrder = await order.save({ session });
    });

    return { data: updatedOrder };
  } catch (error) {
    return { error: error.message || "Inventory reservation failed." };
  } finally {
    await session.endSession();
  }
}
