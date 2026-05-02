const mongoose = require("mongoose");


/* =========================
   SALES SUB-SCHEMA
   (SOURCE OF REVENUE)
========================= */
const salesSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true
    },

    liters: {
      type: Number,
      required: true,
      min: 0
    },

    cash: {
      type: Number,
      required: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);


/* =========================
   STANDING ORDERS
========================= */
const standingOrderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    liters: { type: Number, required: true, min: 0 },

    isActive: { type: Boolean, default: true },
    omitted: { type: Boolean, default: false },

    effectiveDate: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
      }
    }
  },
  { timestamps: true }
);


/* =========================
   MAIN SCHEMA
========================= */
const milkSchema = new mongoose.Schema(
  {
    /* =========================
       RELATIONS
    ========================= */
    dairy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dairy",
      required: true,
      index: true
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },


    /* =========================
       PRODUCTION DATA
    ========================= */
    liters: {
      type: Number,
      required: true,
      min: 0
    },

    remarks: {
      type: String,
      default: "",
      trim: true
    },

    date: {
      type: Date,
      default: Date.now,
      index: true
    },


    /* =========================
       DATE KEYS
    ========================= */
    day: { type: String, index: true },   // YYYY-MM-DD
    month: { type: String, index: true }, // YYYY-MM


    /* =========================
       DAILY STATS (SNAPSHOT ONLY)
       ⚠ NOT SOURCE OF TRUTH FOR REVENUE
    ========================= */
    dailyStats: {
      consumed: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
      price: { type: Number, default: 0 },

      // 🔴 LEGACY ONLY (DO NOT AGGREGATE FROM THIS)
      cash: { type: Number, default: 0 },

      locked: { type: Boolean, default: false }
    },


    /* =========================
       SALES (SOURCE OF TRUTH)
    ========================= */
    sales: [salesSchema],


    /* =========================
       STANDING ORDERS
    ========================= */
    standingOrders: [standingOrderSchema]
  },
  {
    timestamps: true,
    minimize: false
  }
);


/* =========================
   AUTO DATE NORMALIZATION
========================= */
milkSchema.pre("save", function (next) {
  const d = new Date(this.date);

  this.day = d.toISOString().split("T")[0];
  this.month = this.day.slice(0, 7);

  next();
});


/* =========================
   ACTIVE STANDING ORDERS
========================= */
milkSchema.methods.getActiveStandingOrders = function () {
  const today = new Date().toISOString().split("T")[0];

  return this.standingOrders.filter(o =>
    !o.omitted &&
    o.isActive &&
    o.effectiveDate.toISOString().split("T")[0] <= today
  );
};


/* =========================
   OMIT ORDER
========================= */
milkSchema.statics.omitStandingOrder = async function (milkId, orderId) {
  return this.updateOne(
    { _id: milkId, "standingOrders._id": orderId },
    {
      $set: {
        "standingOrders.$.omitted": true,
        "standingOrders.$.isActive": false
      }
    }
  );
};


/* =========================
   SAVE DAILY STATS
   (PRODUCTION SNAPSHOT ONLY)
========================= */
milkSchema.statics.saveDailyStats = async function ({
  day,
  consumed,
  price
}) {
  const agg = await this.aggregate([
    { $match: { day } },
    {
      $group: {
        _id: null,
        total: { $sum: "$liters" }
      }
    }
  ]);

  const total = agg[0]?.total || 0;

  const available = total - consumed;

  return this.updateMany(
    { day },
    {
      $set: {
        "dailyStats.consumed": consumed,
        "dailyStats.available": available,
        "dailyStats.price": price,

        // ⚠ DO NOT RELY ON THIS FOR REPORTING
        "dailyStats.cash": consumed * price
      }
    }
  );
};


/* =========================
   DAILY REPORT (SOURCE OF TRUTH)
========================= */
milkSchema.statics.getDailyReport = async function (day) {
  const records = await this.find({ day })
    .populate("dairy")
    .populate("recordedBy", "name")
    .lean();

  const total = records.reduce((s, r) => s + r.liters, 0);

  const stats = records.find(r => r.dailyStats)?.dailyStats || {};

  // 🔥 IMPORTANT: derive cash from sales, NOT dailyStats
  const sales = records.flatMap(r => r.sales || []);

  const cash = sales.reduce((s, r) => s + (r.cash || 0), 0);

  return {
    records,
    sales,
    stats: {
      total,
      consumed: stats.consumed || 0,
      available: stats.available || total,
      price: stats.price || 0,
      locked: stats.locked || false,

      // 🔵 GLOBAL REVENUE (REAL SOURCE)
      cash
    }
  };
};


/* =========================
   MONTHLY REPORT
========================= */
milkSchema.statics.getMonthlyReport = async function (month) {

  const grouped = await this.aggregate([
    { $match: { month } },
    {
      $group: {
        _id: "$dairy",
        total: { $sum: "$liters" },
        days: { $addToSet: "$day" }
      }
    },
    {
      $project: {
        dairy: "$_id",
        total: 1,
        avg: {
          $divide: ["$total", { $size: "$days" }]
        }
      }
    }
  ]);

  const cashAgg = await this.aggregate([
    { $match: { month } },

    {
      $unwind: "$sales"
    },

    {
      $group: {
        _id: null,
        totalCash: { $sum: "$sales.cash" }
      }
    }
  ]);

  return {
    records: grouped,
    stats: {
      cash: cashAgg[0]?.totalCash || 0
    }
  };
};


/* =========================
   INDEXES
========================= */
milkSchema.index({ dairy: 1, day: 1 });
milkSchema.index({ dairy: 1, month: 1 });
milkSchema.index({ date: -1 });


/* =========================
   EXPORT
========================= */
module.exports = mongoose.model("Milk", milkSchema);