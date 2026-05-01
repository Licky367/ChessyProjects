const express = require("express");
const router = express.Router();

const controller = require("../controllers/financialsController");


/* =========================
   DAILY FINANCIALS
========================= */
router.get("/daily", controller.getDailyFinancials);


/* =========================
   MONTHLY FINANCIALS
========================= */
router.get("/monthly", controller.getMonthlyFinancials);


/* =========================
   YEARLY FINANCIALS
========================= */
router.get("/yearly", controller.getYearlyFinancials);


/* =========================
   FETCH SAVED RECORD
========================= */
router.get("/record", controller.getFinancialRecord);


module.exports = router;