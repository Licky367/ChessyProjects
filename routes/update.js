// routes/update.js

const express = require('express');
const router = express.Router();

const controller = require('../controllers/updateController');
const upload = require('../middleware/uploadMiddleware');


/* =========================
   AUTH MIDDLEWARE
========================= */
function isAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }

  req.user = req.session.user;
  next();
}


/* =========================
   LIST PAGES
========================= */

router.get('/dairyProjects', controller.viewDairyProjects);
router.get('/structures', controller.viewStructures);


/* =========================
   PROFILE PAGE
========================= */

router.get('/dairy/:id', controller.viewPage);


/* =========================
   🟥 COMMENTS + PROFILE IMAGE (EXISTING)
========================= */

router.post('/dairy/:id/comment', isAuth, controller.comment);

router.put(
  '/dairy/:id/image',
  isAuth,
  upload.single('profileImage'),
  controller.image
);


/* =========================================================
   🟥 MEDICAL SYSTEM (EXTENDED)
========================================================= */

/**
 * MARK MEDICAL
 * - Sets Dairy.medicalAttention.isMarked = true
 * - Saves type + details
 * - Creates Update record (type: medical, status: marked)
 */
router.post(
  '/dairy/:id/medical-mark',
  isAuth,
  controller.markMedical
);

/**
 * UNMARK MEDICAL (ADMIN ONLY)
 * - Sets Dairy.medicalAttention.isMarked = false
 * - Requires charges + description
 * - Creates Update record (type: medical, status: cleared)
 */
router.post(
  '/dairy/:id/medical-unmark',
  isAuth,
  controller.unmarkMedical
);


/* =========================================================
   🟦 POSTS SYSTEM (EXISTING)
========================================================= */

/**
 * CREATE POST (text + optional image)
 */
router.post(
  '/dairy/:id/post',
  isAuth,
  upload.single('image'),
  controller.createPost
);

/**
 * LIKE / UNLIKE POST
 */
router.post(
  '/post/:id/like',
  isAuth,
  controller.likePost
);

/**
 * ADD COMMENT TO POST
 */
router.post(
  '/post/:id/comment',
  isAuth,
  controller.addPostComment
);

/**
 * DELETE POST
 */
router.delete(
  '/post/:id',
  isAuth,
  controller.deletePost
);

/**
 * DELETE COMMENT
 */
router.delete(
  '/comment/:id',
  isAuth,
  controller.deleteComment
);


/* =========================================================
   🟩 MAINTENANCE SYSTEM (NEW)
========================================================= */

/**
 * MARK MAINTENANCE
 * - Sets Dairy.needsMaintenance = true
 * - Creates maintenance update (status: marked)
 */
router.post(
  '/dairy/:id/maintenance/mark',
  isAuth,
  controller.markMaintenance
);


/**
 * CLEAR MAINTENANCE
 * - Sets Dairy.needsMaintenance = false
 * - Requires charges + description
 * - Creates maintenance update (status: cleared)
 */
router.post(
  '/dairy/:id/maintenance/clear',
  isAuth,
  controller.clearMaintenance
);


module.exports = router;