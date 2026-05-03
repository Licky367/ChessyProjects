const express = require("express");
const router = express.Router();
const controller = require("../controllers/nursingController");

router.get("/", controller.renderNursingList);

router.post("/purchase", controller.createPurchase);

router.get("/:id", controller.renderBatchDetails);

router.post("/:id/death", controller.recordDeath);
router.post("/:id/sell", controller.sellPoultry);
router.post("/:id/cage", controller.cageBatch);

module.exports = router;