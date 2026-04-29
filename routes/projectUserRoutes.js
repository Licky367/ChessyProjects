const express = require("express");
const router = express.Router();

const {
  adminCreateUser,
  completeSignup,
} = require("../controllers/projectUserController");

// Admin creates user
router.post("/admin/create-user", adminCreateUser);

// User completes signup
router.post("/complete-signup", completeSignup);

module.exports = router;