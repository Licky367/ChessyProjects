// routes/update.js

const express = require('express');
const router = express.Router();

const controller = require('../controllers/updateController');
const upload = require('../middleware/uploadMiddleware');

/**
 * OPTIONAL AUTH MIDDLEWARE WRAPPER
 */
function isAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }

  req.user = req.session.user;
  next();
}

/**
 * ===========================
 * LIST PAGES
 * ===========================
 */

/**
 * VIEW DAIRY PROJECTS (POSITIVE CODES ONLY)
 * renders: dairyProjects.ejs
 */
router.get('/dairyProjects', controller.viewDairyProjects);

/**
 * VIEW STRUCTURES (NEGATIVE CODES ONLY)
 * renders: structures.ejs
 */
router.get('/structures', controller.viewStructures);


/**
 * ===========================
 * PROFILE PAGE
 * ===========================
 */

/**
 * VIEW DAIRY PROFILE + UPDATES
 * renders: update.ejs / dairyProfiles.ejs
 */
router.get('/dairy/:id', controller.viewPage);


/**
 * ===========================
 * PROFILE ACTIONS
 * ===========================
 */

/**
 * ADD COMMENT
 */
router.post('/dairy/:id/comment', isAuth, controller.comment);

/**
 * UPDATE IMAGE
 */
router.put(
  '/dairy/:id/image',
  isAuth,
  upload.single('profileImage'),
  controller.image
);

module.exports = router;