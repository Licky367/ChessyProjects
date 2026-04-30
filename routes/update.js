const express = require('express');
const router = express.Router();

const controller = require('../controllers/updateController');
const upload = require('../middleware/uploadMiddleware'); // FIXED PATH

/**
 * OPTIONAL AUTH MIDDLEWARE WRAPPER
 * (safe fallback since you're using sessions)
 */
function isAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }

  req.user = req.session.user; // align with controller expectation
  next();
}

/**
 * VIEW DAIRY PROFILE + UPDATES
 */
router.get('/dairy/:id', controller.viewPage);

/**
 * ADD COMMENT (REAL-TIME READY)
 */
router.post(
  '/dairy/:id/comment',
  isAuth,
  controller.comment
);

/**
 * UPDATE IMAGE (UPLOAD + UPDATE LOG)
 */
router.put(
  '/dairy/:id/image',
  isAuth,
  upload.single('profileImage'),
  controller.image
);

module.exports = router;