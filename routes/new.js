const express = require("express");
const router = express.Router();

const newController = require("../controllers/newController");

// =========================
// SHOW FORM PAGE
// =========================
router.get("/new", newController.showForm);

// =========================
// HANDLE FORM SUBMISSION
// =========================
router.post("/new", newController.createRecord);

module.exports = router;