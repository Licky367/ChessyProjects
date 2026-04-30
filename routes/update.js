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
   🟥 MEDICAL (EXISTING)
========================= */

router.post('/dairy/:id/comment', isAuth, controller.comment);

router.put(
  '/dairy/:id/image',
  isAuth,
  upload.single('profileImage'),
  controller.image
);


/* =========================================================
   🟦 POSTS SYSTEM (NEW)
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


module.exports = router;