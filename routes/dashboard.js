const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");

// ================================
// MIDDLEWARE: ADMIN ONLY
// ================================
const ensureAdmin = (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  if (req.user.role !== "admin") {
    return res.status(403).send("Access Denied: Admins only.");
  }

  next();
};

// ================================
// DASHBOARD ROUTES
// ================================
router.get("/dairy", ensureAdmin, dashboardController.getDairyDashboard);
router.get("/poultry", ensureAdmin, dashboardController.getPoultryDashboard);
router.get("/agriculture", ensureAdmin, dashboardController.getAgricultureDashboard);

module.exports = router;