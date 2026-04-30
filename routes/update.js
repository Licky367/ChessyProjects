// routes/update.js

const express = require('express');
const router = express.Router();

const controller = require('../controllers/updateController');
const upload = require('../middlewares/upload');

// VIEW PAGE
router.get('/dairy/:id', controller.viewPage);

// COMMENT
router.post('/dairy/:id/comment', controller.comment);

// IMAGE UPDATE
router.put('/dairy/:id/image', upload.single('profileImage'), controller.image);

module.exports = router;