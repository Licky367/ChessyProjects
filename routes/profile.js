const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

router.get("/profile", profileController.profilePage);
router.post("/profile/update", profileController.updateProfile);

module.exports = router;