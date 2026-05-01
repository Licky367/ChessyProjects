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
    liters: Number(r.liters),
    remarks: r.remarks || "",
    recordedBy: userId
  }));

  return Milk.insertMany(docs);
};


/* =========================
   DAILY STATS (MODEL DRIVEN)
========================= */
exports.getDailyStats = async (day) => {
  return Milk.getDailyReport(day);
};


/* =========================
   SAVE DAILY STATS (LOCKED)
========================= */
exports.saveDailyStats = async ({ date, consumed, price }) => {
  const day = new Date(date).toISOString().split("T")[0];

  return Milk.saveDailyStats({
    day,
    consumed,
    price
  });
};


/* =========================
   MONTHLY STATS (FIXED CASH)
========================= */
exports.getMonthlyStats = async (month) => {
  const records = await Milk.getMonthlyReport(month);

  const dairies = await Dairy.find({
    _id: { $in: records.records.map(r => r.dairy) }
  });

  const map = {};
  dairies.forEach(d => (map[d._id] = d));

  const formatted = records.records.map(r => ({
    dairy: map[r.dairy],
    total: r.total,
    avg: r.avg
  }));


  /* =========================
     CASH LOGIC
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

  const totalCash = cashAgg[0]?.totalCash || 0;

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
   SALES ENGINE CORE
========================= */

/* GET SALES PAGE DATA */
exports.getSalesPageData = async () => {
  const data = await Milk.find({}).lean();

  const standingOrders = [];

  data.forEach(d => {
    if (d.standingOrders?.length) {
      d.standingOrders.forEach(o => {
        standingOrders.push({
          ...o,
          milkId: d._id
        });
      });
    }
  });

  return { standingOrders };
};


/* =========================
   PROCESS DAILY SALES (UPDATED)
   🔥 NOW STORES PER-CUSTOMER SALES
========================= */
exports.processDailySales = async ({ records, price, user }) => {
  const day = new Date().toISOString().split("T")[0];

  if (!records || !records.length) return { day };

  const validRecords = records.filter(r => r.customerName && r.liters);

  const consumed = validRecords.reduce((sum, r) => {
    return sum + Number(r.liters || 0);
  }, 0);

  const sales = validRecords.map(r => ({
    customerName: r.customerName,
    liters: Number(r.liters),
    cash: Number(r.liters) * Number(price)
  }));


  /* =========================
     STORE CUSTOMER SALES
  ========================= */
  await Milk.updateMany(
    { day },
    {
      $push: {
        sales: { $each: sales }
      }
    }
  );


  /* =========================
     UPDATE DAILY STATS
  ========================= */
  await Milk.saveDailyStats({
    day,
    consumed,
    price
  });

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
    effectiveDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
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
   MILKING HISTORY (PER ANIMAL)
========================= */
exports.getMilkingHistory = async ({ dairyId, month }) => {

  const filter = { dairy: dairyId };

  if (month) {
    filter.month = month;
  }

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