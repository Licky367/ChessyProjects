const express = require("express");
const router = express.Router();

const milkController = require("../controllers/milkController");

/* =========================
   MILK COLLECTION
========================= */
router.get("/milk", milkController.getMilkPage);
router.post("/milk", milkController.submitMilk);

/* =========================
   MILK STATS
========================= */
router.get("/milk/stats", milkController.getMilkStats);
router.post("/milk/stats/day", milkController.saveDailyStats);

module.exports = router;