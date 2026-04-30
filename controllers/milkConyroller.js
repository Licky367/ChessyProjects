const milkService = require("../services/milkService");


/* =========================
   GET MILK PAGE
========================= */
exports.getMilkPage = async (req, res) => {
  try {
    const dairies = await milkService.getMilkingAnimals();
    res.render("milk", { dairies });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading milk page");
  }
};


/* =========================
   SUBMIT MILK
========================= */
exports.submitMilk = async (req, res) => {
  try {
    await milkService.saveMilkRecords(req.body.records, req.user?._id);
    res.redirect("/milk/stats?type=day");
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};


/* =========================
   GET STATS
========================= */
exports.getMilkStats = async (req, res) => {
  try {
    const { type = "day", date, month } = req.query;

    if (type === "day") {
      const selectedDate = date || new Date().toISOString().split("T")[0];

      const data = await milkService.getDailyStats(selectedDate);

      return res.render("milkStats", {
        type,
        date: selectedDate,
        records: data.records,
        stats: data.stats
      });
    }

    if (type === "month") {
      const selectedMonth = month || new Date().toISOString().slice(0, 7);

      const data = await milkService.getMonthlyStats(selectedMonth);

      return res.render("milkStats", {
        type,
        month: selectedMonth,
        records: data.records,
        stats: data.stats
      });
    }

    return res.render("milkStats", {
      type,
      records: [],
      stats: {}
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading stats");
  }
};


/* =========================
   SAVE DAILY STATS (LOCK SYSTEM)
   (Now derived from SALES ONLY)
========================= */
exports.saveDailyStats = async (req, res) => {
  try {
    const { date, price } = req.body;

    await milkService.lockDailyStats({
      date,
      price: Number(price)
    });

    res.redirect(`/milk/stats?type=day&date=${date}`);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};


/* =========================
   🔥 SALES SYSTEM (NEW)
========================= */

/* GET SALES PAGE */
exports.getSalesPage = async (req, res) => {
  try {
    const data = await milkService.getSalesPageData();

    res.render("sales", {
      standingOrders: data.standingOrders
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading sales page");
  }
};


/* SUBMIT DAILY SALES */
exports.submitSales = async (req, res) => {
  try {
    const { records, price } = req.body;

    const result = await milkService.processDailySales({
      records,
      price: Number(price),
      user: req.user
    });

    res.redirect(`/milk/stats?type=day&date=${result.date}`);

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};


/* ADD STANDING ORDER */
exports.addStandingOrder = async (req, res) => {
  try {
    const { customerName, liters } = req.body;

    await milkService.addStandingOrder({
      customerName,
      liters
    });

    res.redirect("/sales");

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};


/* OMIT STANDING ORDER (ADMIN ONLY LOGIC IN SERVICE) */
exports.omitStandingOrder = async (req, res) => {
  try {
    const { id } = req.body;

    await milkService.omitStandingOrder({
      orderId: id,
      user: req.user
    });

    res.redirect("/sales");

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};