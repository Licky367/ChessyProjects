const Milk = require("../models/milk");
const Dairy = require("../models/dairy");


/* =========================
   GET MILKING ANIMALS
========================= */
exports.getMilkingAnimals = async () => {
  return Dairy.find({ isMilking: true }).sort({ code: 1 });
};


/* =========================
   SAVE MILK RECORDS (PRODUCTION)
========================= */
exports.saveMilkRecords = async (records, userId) => {
  if (!records || !records.length) return;

  if (!userId) {
    throw new Error("User ID is required to record milk.");
  }

  const docs = records.map(r => ({
    dairy: r.dairy,
    liters: Number(r.liters) || 0,
    remarks: r.remarks || "",
    recordedBy: userId
  }));

  return Milk.insertMany(docs);
};


/* =========================
   DAILY STATS (READ ONLY)
   - production summary
   - global revenue ONLY
========================= */
exports.getDailyStats = async (day) => {
  const data = await Milk.getDailyReport(day);

  return {
    records: data.records || [],
    stats: {
      total: data.stats?.total || 0,
      consumed: data.stats?.consumed || 0,
      available: data.stats?.available || 0,
      price: data.stats?.price || 0,
      locked: data.stats?.locked || false,

      // 🔵 GLOBAL REVENUE (ONLY SOURCE)
      cash: data.stats?.cash || 0
    },

    // 🟡 PER CUSTOMER SALES (IMPORTANT FOR UI)
    sales: (data.records || []).flatMap(r => r.sales || [])
  };
};


/* =========================
   SAVE DAILY STATS (LOCK SNAPSHOT)
========================= */
exports.saveDailyStats = async ({ day, consumed, price }) => {
  return Milk.saveDailyStats({
    day,
    consumed: Number(consumed) || 0,
    price: Number(price) || 0
  });
};


/* =========================
   GET CURRENT PRICE
========================= */
exports.getCurrentPrice = async () => {
  const latest = await Milk.findOne()
    .sort({ createdAt: -1 })
    .lean();

  return latest?.dailyStats?.price || 0;
};


/* =========================
   MONTHLY STATS
========================= */
exports.getMonthlyStats = async (month) => {
  const data = await Milk.getMonthlyReport(month);

  const dairyIds = data.records.map(r => r.dairy);

  const dairies = await Dairy.find({ _id: { $in: dairyIds } });

  const map = {};
  dairies.forEach(d => (map[d._id] = d));

  const formatted = data.records.map(r => ({
    dairy: map[r.dairy] || null,
    total: r.total || 0,
    avg: r.avg || 0
  }));

  const total = formatted.reduce((s, r) => s + r.total, 0);
  const avg = formatted.length ? total / formatted.length : 0;

  return {
    records: formatted,
    stats: {
      total,
      avg,

      // 🔵 GLOBAL REVENUE
      cash: data.stats?.cash || 0
    }
  };
};


/* =========================
   SALES PAGE DATA
========================= */
exports.getSalesPageData = async () => {
  const latest = await Milk.findOne().sort({ createdAt: -1 }).lean();

  return {
    standingOrders: latest?.standingOrders || []
  };
};


/* =========================
   PROCESS DAILY SALES
   - stores per customer sales
   - calculates global revenue properly
========================= */
exports.processDailySales = async ({ records, price }) => {
  const day = new Date().toISOString().split("T")[0];

  if (!records || !records.length) return { date: day };

  const valid = records.filter(r => r.customerName && r.liters);

  let finalPrice = Number(price);
  if (!finalPrice) finalPrice = await exports.getCurrentPrice();

  /* =========================
     BUILD SALES (PER CUSTOMER)
  ========================= */
  const sales = valid.map(r => ({
    customerName: r.customerName,
    liters: Number(r.liters),
    cash: Number(r.liters) * finalPrice,
    createdAt: new Date()
  }));

  let doc = await Milk.findOne({ day });

  if (!doc) {
    doc = await Milk.create({
      day,
      sales: [],
      dailyStats: {
        consumed: 0,
        price: finalPrice,
        cash: 0,
        locked: false
      }
    });
  }

  /* =========================
     APPEND SALES
  ========================= */
  await Milk.updateOne(
    { _id: doc._id },
    { $push: { sales: { $each: sales } } }
  );

  /* =========================
     RECALCULATE TOTALS
  ========================= */
  const updated = await Milk.findById(doc._id).lean();

  const totalConsumed = (updated.sales || []).reduce(
    (s, r) => s + (r.liters || 0),
    0
  );

  const globalCash = (updated.sales || []).reduce(
    (s, r) => s + (r.cash || 0),
    0
  );

  /* =========================
     SAVE DAILY STATS (SOURCE OF TRUTH)
  ========================= */
  await Milk.saveDailyStats({
    day,
    consumed: totalConsumed,
    price: finalPrice
  });

  await Milk.updateOne(
    { _id: doc._id },
    {
      $set: {
        "dailyStats.cash": globalCash
      }
    }
  );

  return { date: day };
};


/* =========================
   ADD STANDING ORDER
========================= */
exports.addStandingOrder = async ({ customerName, liters }) => {
  const milkDoc = await Milk.findOne().sort({ createdAt: -1 });

  if (!milkDoc) throw new Error("No milk document found");

  milkDoc.standingOrders.push({
    customerName,
    liters,
    effectiveDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isActive: true,
    omitted: false
  });

  return milkDoc.save();
};


/* =========================
   OMIT STANDING ORDER
========================= */
exports.omitStandingOrder = async ({ orderId, user }) => {
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return Milk.updateOne(
    { "standingOrders._id": orderId },
    {
      $set: {
        "standingOrders.$.omitted": true,
        "standingOrders.$.isActive": false
      }
    }
  );
};


/* =========================
   MILKING HISTORY
========================= */
exports.getMilkingHistory = async ({ dairyId, month }) => {
  const filter = { dairy: dairyId };
  if (month) filter.month = month;

  const records = await Milk.find(filter)
    .populate("recordedBy", "name")
    .sort({ date: 1 })
    .lean();

  const grouped = {};

  records.forEach(r => {
    if (!grouped[r.day]) {
      grouped[r.day] = { entries: [], total: 0 };
    }

    grouped[r.day].entries.push(r);
    grouped[r.day].total += r.liters;
  });

  const monthlyTotal = records.reduce((s, r) => s + r.liters, 0);

  return {
    grouped,
    monthlyTotal,
    hasData: records.length > 0
  };
};