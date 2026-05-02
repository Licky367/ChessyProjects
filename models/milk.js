const mongoose = require("mongoose");


/* =========================
   SALES SUB-SCHEMA
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
       RELATION TO DAIRY
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
       MILK DATA
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
    day: { type: String, index: true },    // YYYY-MM-DD
    month: { type: String, index: true },  // YYYY-MM


    /* =========================
       DAILY STATS (FINANCIAL SUMMARY)
       ⚠️ DO NOT USE FOR SALES SOURCE
    ========================= */
    dailyStats: {
      consumed: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
      price: { type: Number, default: 0 },
      cash: { type: Number, default: 0 },
      locked: { type: Boolean, default: false }
    },


    /* =========================
       SALES RECORDS (DAILY)
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
   OMIt ORDER (STATIC SAFE)
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
   ⚠️ USED ONLY FOR SUMMARY SNAPSHOT
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
  const cash = consumed * price;

  return this.updateMany(
    { day },
    {
      $set: {
        "dailyStats.consumed": consumed,
        "dailyStats.available": available,
        "dailyStats.price": price,
        "dailyStats.cash": cash
      }
    }
  );
};


/* =========================
   DAILY REPORT (FIXED RELIABILITY)
========================= */
milkSchema.statics.getDailyReport = async function (day) {
  const records = await this.find({ day })
    .populate("dairy")
    .populate("recordedBy", "name")
    .lean();

  const total = records.reduce((sum, r) => sum + r.liters, 0);

  // safer aggregation from first available stats snapshot
  const stats = records.find(r => r.dailyStats)?.dailyStats || {};

  return {
    records,
    stats: {
      total,
      consumed: stats.consumed || 0,
      available: stats.available || total,
      cash: stats.cash || 0,
      locked: stats.locked || false
    }
  };
};


/* =========================
   MONTHLY REPORT (FIXED CASH RELIABILITY)
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
      $group: {
        _id: "$day",
        cash: { $first: "$dailyStats.cash" }
      }
    },
    {
      $group: {
        _id: null,
        totalCash: { $sum: "$cash" }
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