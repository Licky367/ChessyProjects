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


/* =========================
   SALES (NEW EXTENSION)
========================= */

// load sales page
router.get("/sales", milkController.getSalesPage);

// submit daily sales
router.post("/sales", milkController.submitSales);

// add standing order
router.post("/sales/standing", milkController.addStandingOrder);

// omit standing order (admin only)
router.post("/sales/standing/omit", milkController.omitStandingOrder);


/* =========================
   🆕 MILKING HISTORY (NEW)
========================= */

// view milking history of a specific dairy animal
router.get("/milk/history/:dairyId", milkController.getMilkingHistory);


module.exports = router;