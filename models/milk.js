const mongoose = require('mongoose');

const milkSchema = new mongoose.Schema(
  {
    /* =========================
       DAIRY REFERENCE
    ========================= */
    dairy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dairy',
      required: true,
      index: true
    },

    /* =========================
       MILK PRODUCED (LITERS)
    ========================= */
    liters: {
      type: Number,
      required: true,
      min: 0
    },

    /* =========================
       REMARKS
    ========================= */
    remarks: {
      type: String,
      trim: true,
      default: ''
    },

    /* =========================
       DATE OF COLLECTION
    ========================= */
    date: {
      type: Date,
      default: Date.now,
      index: true
    },

    /* =========================
       DATE HELPERS (🔥 IMPORTANT)
    ========================= */
    day: {
      type: String, // e.g. 2026-04-30
      index: true
    },

    month: {
      type: String, // e.g. 2026-04
      index: true
    },

    /* =========================
       🧮 COMPUTED (PER COW)
    ========================= */

    dailyTotalPerCow: {
      type: Number,
      default: 0
    },

    monthlyTotalPerCow: {
      type: Number,
      default: 0
    },

    monthlyAveragePerCow: {
      type: Number,
      default: 0
    },

    /* =========================
       RECORDED BY
    ========================= */
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },

  {
    timestamps: true
  }
);


/* =========================
   INDEXES
========================= */

milkSchema.index({ dairy: 1, day: 1 });
milkSchema.index({ dairy: 1, month: 1 });
milkSchema.index({ month: 1 });


/* =========================
   PRE-SAVE (🔥 CORE LOGIC)
========================= */
milkSchema.pre('save', async function (next) {
  try {
    const Milk = mongoose.model('Milk');

    const d = new Date(this.date);

    // format helpers
    this.day = d.toISOString().split('T')[0];      // YYYY-MM-DD
    this.month = this.day.slice(0, 7);             // YYYY-MM

    /* =========================
       DAILY TOTAL PER COW
    ========================= */
    const dailyAgg = await Milk.aggregate([
      {
        $match: {
          dairy: this.dairy,
          day: this.day
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$liters' }
        }
      }
    ]);

    const dailyTotal = (dailyAgg[0]?.total || 0) + this.liters;
    this.dailyTotalPerCow = dailyTotal;

    /* =========================
       MONTHLY TOTAL PER COW
    ========================= */
    const monthlyAgg = await Milk.aggregate([
      {
        $match: {
          dairy: this.dairy,
          month: this.month
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$liters' },
          days: { $addToSet: '$day' }
        }
      }
    ]);

    const prevTotal = monthlyAgg[0]?.total || 0;
    const daysSet = monthlyAgg[0]?.days || [];

    const monthlyTotal = prevTotal + this.liters;

    // include today if not already
    if (!daysSet.includes(this.day)) {
      daysSet.push(this.day);
    }

    const avg =
      daysSet.length > 0 ? monthlyTotal / daysSet.length : monthlyTotal;

    this.monthlyTotalPerCow = monthlyTotal;
    this.monthlyAveragePerCow = avg;

    next();
  } catch (err) {
    next(err);
  }
});


/* =========================
   STATIC: GLOBAL STATS
========================= */

milkSchema.statics.computeGlobalStats = async function (month) {
  return this.aggregate([
    {
      $match: { month }
    },
    {
      $group: {
        _id: null,
        totalMilk: { $sum: '$liters' },
        cows: { $addToSet: '$dairy' },
        days: { $addToSet: '$day' }
      }
    },
    {
      $project: {
        totalMilk: 1,
        totalCows: { $size: '$cows' },
        totalDays: { $size: '$days' },
        avgPerCow: {
          $cond: [
            { $gt: [{ $size: '$cows' }, 0] },
            { $divide: ['$totalMilk', { $size: '$cows' }] },
            0
          ]
        }
      }
    }
  ]);
};


/* =========================
   EXPORT
========================= */
module.exports = mongoose.model('Milk', milkSchema);