const express = require('express');
const controller = require('../controllers/user');
const { requireAuth, forwardAuth } = require('../middlewares/userAuth');
const multer = require('multer')
const router = express.Router();

const storage = multer.memoryStorage(); // Store the file in memory before uploading to Firebase
const upload = multer({ storage: storage });


// 1.1 Login
router.get('/login', forwardAuth, controller.getLogin);
router.post('/login', controller.postLogin);

// 1.2 Register
router.get('/register', controller.getRegister);
router.post('/register', controller.postRegister);

router.get('/logout', requireAuth, controller.getLogout);

router.get('/dashboard', requireAuth, controller.getProfile);

module.exports = router;