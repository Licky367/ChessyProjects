const Milk = require("../models/milk");
const Update = require("../models/Update");
const Financial = require("../models/financials");


/* =========================
   FINANCIAL DASHBOARD VIEW
========================= */
exports.financialsView = async (req, res) => {
  try {

    const { day, month, year, type = "monthly" } = req.query;

    let financial = null;
    let sales = [];
    let expenses = [];
    let totalSalesCash = 0;
    let totalExpenses = 0;


    /* =========================
       1. GET STORED FINANCIAL RECORD
    ========================= */
    financial = await Financial.findOne({
      periodType: type,
      ...(day && { day }),
      ...(month && { month }),
      ...(year && { year: Number(year) })
    });


    /* =========================
       2. MILK SALES (INCOME DETAIL)
    ========================= */
    const milkMatch = {};

    if (day) milkMatch.day = day;
    if (month) milkMatch.month = month;
    if (year) {
      milkMatch.$expr = {
        $eq: [{ $year: "$date" }, Number(year)]
      };
    }

    const milkDocs = await Milk.find(milkMatch).lean();

    milkDocs.forEach(doc => {
      if (doc.sales?.length) {
        doc.sales.forEach(s => {
          sales.push(s);
          totalSalesCash += s.cash || 0;
        });
      }
    });


    /* =========================
       3. EXPENSES (UPDATE MODEL)
    ========================= */
    const expenseMatch = {};

    if (month) {
      expenseMatch.month = month;
    } else if (year) {
      expenseMatch.$expr = {
        $eq: [{ $year: "$createdAt" }, Number(year)]
      };
    }

    const updateDocs = await Update.find(expenseMatch).lean();

    updateDocs.forEach(u => {
      if (u.type === "maintenance") {
        expenses.push({
          type: "maintenance",
          maintenance: u.maintenance,
          charges: u.maintenance?.charges || 0
        });
        totalExpenses += u.maintenance?.charges || 0;
      }

      if (u.type === "medical") {
        expenses.push({
          type: "medical",
          medical: u.medical,
          charges: u.medical?.charges || 0
        });
        totalExpenses += u.medical?.charges || 0;
      }
    });


    /* =========================
       4. RENDER VIEW
    ========================= */
    return res.render("financials", {
      financial,
      sales,
      expenses,
      totalSalesCash,
      totalExpenses,
      day,
      month,
      year,
      type
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send("Error loading financial dashboard");
  }
};