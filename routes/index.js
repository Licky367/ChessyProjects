const express = require("express");
const router = express.Router();


// =========================
// SERVICE
// =========================
const indexService = {
  getUserDisplay: (req) => {
    return {
      name: req.session.user.name,
      id: req.session.user._id
    };
  }
};


// =========================
// AUTH MIDDLEWARE
// =========================
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};


// =========================
// CONTROLLER
// =========================
const indexController = {

  home: (req, res) => {
    try {
      const user = indexService.getUserDisplay(req);

      res.render("index", { user });

    } catch (error) {
      console.error("Index Error:", error.message);

      res.status(500).send(`
        <h2>Server Error</h2>
        <p>${error.message}</p>
      `);
    }
  }

};


// =========================
// ROUTES
// =========================

// 🔐 PROTECTED HOME ROUTE
router.get("/", requireLogin, indexController.home);

module.exports = router;