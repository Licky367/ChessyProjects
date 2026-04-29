const express = require("express");
const router = express.Router();
const multer = require("multer");

const authController = require("../controllers/authController");

// ===== FILE UPLOAD CONFIG =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ===== ROUTES =====
router.get("/signup", authController.renderSignup);
router.post("/signup", upload.single("profileImage"), authController.signup);

router.get("/login", authController.renderLogin);
router.post("/login", authController.login);

router.get("/logout", authController.logout);

module.exports = router;