const mongoose = require('mongoose');


/* =========================
   STANDING ORDERS (SUB-SCHEMA)
========================= */
const standingOrderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    liters: { type: Number, required: true, min: 0 },

    isActive: { type: Boolean, default: true },

    // 🔥 becomes active tomorrow automatically
    effectiveDate: {
      type: Date,
      default: function () {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
      }
    },

    omitted: { type: Boolean, default: false }
  },
  { timestamps: true }
);


/* =========================
   MAIN MILK SCHEMA
========================= */
const milkSchema = new mongoose.Schema(
  {
    /* =========================
       RELATION TO ANIMAL
    ========================= */
    dairy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dairy',
      required: true,
      index: true
    },

    /* =========================
       🔥 WHO RECORDED (NEW)
    ========================= */
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
      trim: true,
      default: ''
    },

    date: {
      type: Date,
      default: Date.now,
      index: true
    },

    /* =========================
       DATE HELPERS (FAST FILTERING)
    ========================= */
    day: { type: String, index: true },   // YYYY-MM-DD
    month: { type: String, index: true }, // YYYY-MM


    /* =========================
       DAILY FINANCIAL CORE
    ========================= */
    dailyStats: {
      consumed: { type: Number, default: 0 },   // from SALES
      available: { type: Number, default: 0 },
      price: { type: Number, default: 0 },
      cash: { type: Number, default: 0 },
      locked: { type: Boolean, default: false }
    },


    /* =========================
       STANDING ORDERS (EMBEDDED)
    ========================= */
    standingOrders: [standingOrderSchema]
  },

  {
    timestamps: true,
    minimize: false
  }
);


/* =========================
   DATE NORMALIZATION
========================= */
milkSchema.pre('save', function (next) {
  const d = new Date(this.date);

  this.day = d.toISOString().split('T')[0];   // YYYY-MM-DD
  this.month = this.day.slice(0, 7);          // YYYY-MM

  next();
});


/* =========================
   GET ACTIVE STANDING ORDERS
========================= */
milkSchema.methods.getActiveStandingOrders = function () {
  const today = new Date().toISOString().split('T')[0];

  return this.standingOrders.filter(o =>
    !o.omitted &&
    o.isActive &&
    o.effectiveDate.toISOString().split('T')[0] <= today
  );
};


/* =========================
   OMIT STANDING ORDER
========================= */
milkSchema.statics.omitStandingOrder = async function (milkId, orderId) {
  return this.updateOne(
    { _id: milkId, 'standingOrders._id': orderId },
    {
      $set: {
        'standingOrders.$.omitted': true,
        'standingOrders.$.isActive': false
      }
    }
  );
};


/* =========================
   SAVE DAILY STATS (FROM SALES)
========================= */
milkSchema.statics.saveDailyStats = async function ({ day, consumed, price }) {

  // 🔥 prevent overwrite if locked
  const existing = await this.findOne({ day, 'dailyStats.locked': true });
  if (existing) {
    throw new Error('Daily stats already locked.');
  }

  // total milk for the day
  const agg = await this.aggregate([
    { $match: { day } },
    { $group: { _id: null, total: { $sum: '$liters' } } }
  ]);

  const total = agg[0]?.total || 0;

  const available = total - consumed;
  const cash = consumed * price;

  return this.updateMany(
    { day },
    {
      $set: {
        'dailyStats.consumed': consumed,
        'dailyStats.available': available,
        'dailyStats.price': price,
        'dailyStats.cash': cash,
        'dailyStats.locked': true
      }
    }
  );
};


/* =========================
   DAILY REPORT
========================= */
milkSchema.statics.getDailyReport = async function (day) {

  const records = await this.find({ day })
    .populate('dairy')
    .populate('recordedBy', 'name');

  const total = records.reduce((sum, r) => sum + r.liters, 0);
  const stats = records[0]?.dailyStats || {};

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
   MONTHLY REPORT
========================= */
milkSchema.statics.getMonthlyReport = async function (month) {

  const grouped = await this.aggregate([
    { $match: { month } },

    {
      $group: {
        _id: '$dairy',
        total: { $sum: '$liters' },
        days: { $addToSet: '$day' }
      }
    },

    {
      $project: {
        dairy: '$_id',
        total: 1,
        avg: {
          $divide: ['$total', { $size: '$days' }]
        }
      }
    }
  ]);

  /* =========================
     CORRECT MONTHLY CASH
  ========================= */
  const cashAgg = await this.aggregate([
    { $match: { month } },
    {
      $group: {
        _id: null,
        totalCash: { $sum: '$dailyStats.cash' }
      }
    }
  ]);

  const cash = cashAgg[0]?.totalCash || 0;

  return {
    records: grouped,
    stats: {
      cash
    }
  };
};


/* =========================
   🔥 INDEXES (IMPORTANT FOR HISTORY VIEW)
========================= */

// fast filtering per animal + month
milkSchema.index({ dairy: 1, month: 1 });

// fast per-day lookups
milkSchema.index({ dairy: 1, day: 1 });

// sorting optimization
milkSchema.index({ date: -1 });


/* =========================
   EXPORT
========================= */
module.exports = mongoose.model('Milk', milkSchema);