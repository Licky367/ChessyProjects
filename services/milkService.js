const Milk = require("../models/milk");
const Dairy = require("../models/dairy");


/* =========================
   GET MILKING ANIMALS
========================= */
exports.getMilkingAnimals = async () => {
  return Dairy.find({ isMilking: true }).sort({ code: 1 });
};


/* =========================
   SAVE MILK RECORDS
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
   DAILY STATS (READ ONLY SAFE)
========================= */
exports.getDailyStats = async (day) => {
  const data = await Milk.getDailyReport(day);

  return {
    records: data.records || [],
    stats: {
      total: data.stats?.total || 0,          // production total
      consumed: data.stats?.consumed || 0,    // total sold
      available: data.stats?.available || 0,
      price: data.stats?.price || 0,
      locked: data.stats?.locked || false,
      cash: data.stats?.cash || 0             // GLOBAL revenue ONLY
    }
  };
};


/* =========================
   SAVE DAILY STATS (LOCKED MODEL)
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
  const records = await Milk.getMonthlyReport(month);

  const dairyIds = records?.records?.map(r => r.dairy) || [];

  const dairies = await Dairy.find({
    _id: { $in: dairyIds }
  });

  const map = {};
  dairies.forEach(d => (map[d._id] = d));

  const formatted = (records.records || []).map(r => ({
    dairy: map[r.dairy] || null,
    total: r.total || 0,
    avg: r.avg || 0
  }));


  /* =========================
     GLOBAL CASH (PRODUCTION REVENUE)
  ========================= */
  const cashAgg = await Milk.aggregate([
    { $match: { month } },
    {
      $group: {
        _id: "$day",
        cash: { $first: "$dailyStats.cash" },
        locked: { $first: "$dailyStats.locked" }
      }
    },
    { $match: { locked: true } },
    {
      $group: {
        _id: null,
        totalCash: { $sum: "$cash" }
      }
    }
  ]);

  const totalCash = cashAgg?.[0]?.totalCash || 0;

  const total = formatted.reduce((sum, r) => sum + r.total, 0);
  const avg = formatted.length ? total / formatted.length : 0;

  return {
    records: formatted,
    stats: {
      total,
      avg,
      cash: totalCash
    }
  };
};


/* =========================
   SALES PAGE DATA
========================= */
exports.getSalesPageData = async () => {
  const latest = await Milk.findOne()
    .sort({ createdAt: -1 })
    .lean();

  return {
    standingOrders: latest?.standingOrders || []
  };
};


/* =========================
   PROCESS DAILY SALES (CORE FIXED LOGIC)
========================= */
exports.processDailySales = async ({ records, price, user }) => {
  const day = new Date().toISOString().split("T")[0];

  if (!records || !records.length) return { date: day };

  const validRecords = records.filter(r => r.customerName && r.liters);


  /* =========================
     GET PRICE (FALLBACK SAFE)
  ========================= */
  let finalPrice = Number(price);

  if (!finalPrice) {
    finalPrice = await exports.getCurrentPrice();
  }


  /* =========================
     BUILD SALES ENTRIES
  ========================= */
  const sales = validRecords.map(r => ({
    customerName: r.customerName,
    liters: Number(r.liters),
    cash: Number(r.liters) * finalPrice,
    createdAt: new Date()
  }));


  /* =========================
     FIND OR CREATE DAILY DOC
  ========================= */
  let doc = await Milk.findOne({ day });

  if (!doc) {
    doc = await Milk.create({
      day,
      sales: [],
      dailyStats: {
        consumed: 0,
        price: finalPrice,
        locked: false,
        cash: 0
      }
    });
  }


  /* =========================
     APPEND SALES (NO OVERWRITE)
  ========================= */
  await Milk.updateOne(
    { _id: doc._id },
    {
      $push: {
        sales: { $each: sales }
      }
    }
  );


  /* =========================
     RECALCULATE TOTAL SOLD (IMPORTANT FIX)
  ========================= */
  const updatedDoc = await Milk.findById(doc._id).lean();

  const totalConsumed = (updatedDoc.sales || []).reduce(
    (sum, s) => sum + Number(s.liters || 0),
    0
  );


  /* =========================
     GLOBAL REVENUE (ONLY HERE)
  ========================= */
  const globalCash = totalConsumed * finalPrice;


  /* =========================
     UPDATE DAILY STATS (SOURCE OF TRUTH)
  ========================= */
  await Milk.saveDailyStats({
    day,
    consumed: totalConsumed,
    price: finalPrice
  });

  /* overwrite cash safely */
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

  if (!milkDoc) {
    throw new Error("No milk document found");
  }

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
      grouped[r.day] = {
        entries: [],
        total: 0
      };
    }

    grouped[r.day].entries.push(r);
    grouped[r.day].total += r.liters;
  });

  const monthlyTotal = records.reduce((sum, r) => sum + r.liters, 0);

  return {
    grouped,
    monthlyTotal,
    hasData: records.length > 0
  };
};