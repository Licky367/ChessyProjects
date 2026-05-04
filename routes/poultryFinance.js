const express = require("express");
const router = express.Router();
const financeController = require("../controllers/financeController");

router.get("/", financeController.renderFinancePage);
router.post("/add", financeController.addInvestment);
router.post("/reinvest", financeController.reinvest);

module.exports = router;