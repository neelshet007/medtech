import { connectToDatabase } from "@/lib/db";
import { HealthReport } from "@/models/HealthReport";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

function toObjectIdString(value) {
  return value?.toString?.() || value;
}

function getStartOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getStartOfWeek(date = new Date()) {
  const next = getStartOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? 6 : day - 1;
  next.setDate(next.getDate() - diff);
  return next;
}

function getStartOfMonth(date = new Date()) {
  const next = getStartOfDay(date);
  next.setDate(1);
  return next;
}

function getDateDaysAgo(days) {
  const next = getStartOfDay(new Date());
  next.setDate(next.getDate() - days);
  return next;
}

function safeMetric(value, unit) {
  return value ? `${value}${unit ? ` ${unit}` : ""}` : "--";
}

export async function getPatientOverview(userId) {
  await connectToDatabase();

  const [pendingOrders, deliveredOrders, totalOrders, activeDelivery, latestReport] = await Promise.all([
    Order.countDocuments({
      user: userId,
      $or: [
        { paymentStatus: "Pending" },
        { paymentStatus: "Pending (COD)" },
        { orderStatus: { $in: ["Processing", "Shipped", "Out for Delivery"] } },
      ],
    }),
    Order.countDocuments({ user: userId, orderStatus: "Delivered" }),
    Order.countDocuments({ user: userId }),
    Order.findOne({
      user: userId,
      orderStatus: { $in: ["Processing", "Shipped", "Out for Delivery"] },
    })
      .sort({ updatedAt: -1 })
      .lean(),
    HealthReport.findOne({ user: userId }).sort({ reportDate: -1 }).lean(),
  ]);

  return {
    counts: {
      pendingOrders,
      deliveredOrders,
      totalOrders,
    },
    activeDelivery,
    latestReport,
  };
}

export async function getHealthRecords(userId) {
  await connectToDatabase();

  const reports = await HealthReport.find({ user: userId }).sort({ reportDate: -1 }).limit(12).lean();
  const latestMetrics = reports[0]?.metrics || {};

  return {
    reports,
    summaryCards: [
      {
        label: "Heart Rate",
        value: safeMetric(latestMetrics.heartRate, "bpm"),
        tone: "sky",
      },
      {
        label: "Blood Pressure",
        value:
          latestMetrics.bloodPressureSys && latestMetrics.bloodPressureDia
            ? `${latestMetrics.bloodPressureSys}/${latestMetrics.bloodPressureDia} mmHg`
            : "--",
        tone: "indigo",
      },
      {
        label: "Weight",
        value: safeMetric(latestMetrics.weight, "kg"),
        tone: "emerald",
      },
      {
        label: "Sugar",
        value: safeMetric(latestMetrics.sugarLevel, "mg/dL"),
        tone: "cyan",
      },
    ],
  };
}

export async function getPatientProfile(userId) {
  await connectToDatabase();

  const [user, orders, latestReport] = await Promise.all([
    User.findById(userId).lean(),
    Order.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean(),
    HealthReport.findOne({ user: userId }).sort({ reportDate: -1 }).lean(),
  ]);

  return { user, orders, latestReport };
}

export async function getAdminAnalytics() {
  await connectToDatabase();

  const now = new Date();
  const dayStart = getStartOfDay(now);
  const weekStart = getStartOfWeek(now);
  const monthStart = getStartOfMonth(now);
  const dailyRevenueStart = getDateDaysAgo(6);

  const completedMatch = {
    paymentStatus: { $in: ["Completed"] },
  };

  const [
    totals,
    totalOrders,
    pendingOrdersCount,
    completedOrdersCount,
    revenueTodayAgg,
    revenueWeekAgg,
    revenueMonthAgg,
    customersCount,
    dailyRevenue,
    categoryRevenue,
    customerRevenue,
    pendingOrders,
    completedOrders,
  ] = await Promise.all([
    Order.aggregate([
      { $match: completedMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
    Order.countDocuments(),
    Order.countDocuments({
      $or: [
        { paymentStatus: "Pending" },
        { paymentStatus: "Pending (COD)" },
        { orderStatus: { $in: ["Processing", "Shipped", "Out for Delivery"] } },
      ],
    }),
    Order.countDocuments({ orderStatus: "Delivered" }),
    Order.aggregate([
      { $match: { ...completedMatch, createdAt: { $gte: dayStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.aggregate([
      { $match: { ...completedMatch, createdAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.aggregate([
      { $match: { ...completedMatch, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    User.countDocuments(),
    Order.aggregate([
      { $match: { ...completedMatch, createdAt: { $gte: dailyRevenueStart } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]),
    Order.aggregate([
      { $match: completedMatch },
      { $unwind: "$items" },
      {
        $lookup: {
          from: Product.collection.name,
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          quantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: completedMatch },
      {
        $lookup: {
          from: User.collection.name,
          localField: "user",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $group: {
          _id: "$customer._id",
          customerName: { $first: "$customer.name" },
          customerEmail: { $first: "$customer.email" },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.find({
      $or: [
        { paymentStatus: "Pending" },
        { paymentStatus: "Pending (COD)" },
        { orderStatus: { $in: ["Processing", "Shipped", "Out for Delivery"] } },
      ],
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Order.find({ orderStatus: "Delivered" })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  return {
    metrics: {
      totalRevenue: totals[0]?.totalRevenue || 0,
      totalOrders,
      pendingOrders: pendingOrdersCount,
      completedOrders: completedOrdersCount,
      totalCustomers: customersCount || 0,
      revenueToday: revenueTodayAgg[0]?.total || 0,
      revenueThisWeek: revenueWeekAgg[0]?.total || 0,
      revenueThisMonth: revenueMonthAgg[0]?.total || 0,
    },
    dailyRevenue: dailyRevenue.map((entry) => ({
      date: `${entry._id.day}/${entry._id.month}`,
      revenue: entry.revenue,
      orders: entry.orders,
    })),
    revenueByCategory: categoryRevenue.map((entry) => ({
      category: entry._id || "Unknown",
      revenue: entry.revenue,
      quantity: entry.quantity,
    })),
    revenueByCustomer: customerRevenue.map((entry) => ({
      customerId: toObjectIdString(entry._id),
      name: entry.customerName,
      email: entry.customerEmail,
      revenue: entry.revenue,
      orders: entry.orders,
    })),
    pendingOrders,
    completedOrders,
  };
}
