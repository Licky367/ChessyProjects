const express = require("express");
const router = express.Router();
const financeController = require("../controllers/financeController");

// =========================
// VIEW FINANCE DASHBOARD
// =========================
router.get("/", financeController.renderFinancePage);

// =========================
// INVESTMENT
// =========================
router.post("/add", financeController.addInvestment);

// =========================
// REINVEST PROFIT
// =========================
router.post("/reinvest", financeController.reinvest);

// =========================
// PAY WORKERS
// =========================
router.post("/pay-workers", financeController.payWorkers);

// =========================
// CONSUMPTION / EXPENSES
// =========================
router.post("/consumption", financeController.consumption);

module.exports = router;