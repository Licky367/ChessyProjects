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

  const docs = records.map(r => ({
    dairy: r.dairy,
    liters: Number(r.liters),
    remarks: r.remarks || "",
    recordedBy: userId || null
  }));

  return Milk.insertMany(docs);
};


/* =========================
   DAILY STATS (DB DRIVEN)
========================= */
exports.getDailyStats = async (day) => {
  const result = await Milk.getDailyReport(day); // 🔥 use model

  return result;
};


/* =========================
   SAVE DAILY STATS (DB DRIVEN)
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
   MONTHLY STATS (DB DRIVEN)
========================= */
exports.getMonthlyStats = async (month) => {
  const records = await Milk.getMonthlyReport(month); // 🔥 DB aggregation

  // attach dairy info
  const dairies = await Dairy.find({
    _id: { $in: records.map(r => r.dairy) }
  });

  const map = {};
  dairies.forEach(d => (map[d._id] = d));

  const formatted = records.map(r => ({
    dairy: map[r.dairy],
    total: r.total,
    avg: r.avg
  }));

  /* =========================
     🔥 CORRECT CASH LOGIC
     SUM DAILY CASH (NOT PRICE * TOTAL)
  ========================= */
  const cashAgg = await Milk.aggregate([
    { $match: { month } },
    {
      $group: {
        _id: "$day",
        cash: { $first: "$dailyStats.cash" } // one per day
      }
    },
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