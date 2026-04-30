const mongoose = require('mongoose');

const milkSchema = new mongoose.Schema(
  {
    dairy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dairy',
      required: true,
      index: true
    },

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

    day: { type: String, index: true },
    month: { type: String, index: true },

    /* =========================
       DAILY FINANCIAL STATS
    ========================= */
    dailyStats: {
      consumed: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
      price: { type: Number, default: 0 },
      cash: { type: Number, default: 0 },
      locked: { type: Boolean, default: false }
    }
  },

  { timestamps: true }
);


/* =========================
   PRE-SAVE DATE NORMALIZATION
========================= */
milkSchema.pre('save', function (next) {
  const d = new Date(this.date);
  this.day = d.toISOString().split('T')[0];
  this.month = this.day.slice(0, 7);
  next();
});


/* =========================
   STATIC: SAVE DAILY STATS
========================= */
milkSchema.statics.saveDailyStats = async function ({ day, consumed, price }) {
  const Milk = this;

  // check if already locked
  const existing = await Milk.findOne({ day, 'dailyStats.locked': true });
  if (existing) {
    throw new Error('Daily stats already recorded.');
  }

  // total milk that day
  const agg = await Milk.aggregate([
    { $match: { day } },
    { $group: { _id: null, total: { $sum: '$liters' } } }
  ]);

  const total = agg[0]?.total || 0;

  const available = total - consumed;
  const cash = available * price;

  // update ALL records of that day
  await Milk.updateMany(
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

  return { total, consumed, available, cash };
};


/* =========================
   STATIC: DAILY REPORT
========================= */
milkSchema.statics.getDailyReport = async function (day) {
  const records = await this.find({ day }).populate('dairy');

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
   STATIC: MONTHLY REPORT
========================= */
milkSchema.statics.getMonthlyReport = async function (month) {
  return this.aggregate([
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
};


module.exports = mongoose.model('Milk', milkSchema);