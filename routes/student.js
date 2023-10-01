const express = require('express');
const controller = require('../controllers/student');
const { requireAuth, forwardAuth } = require('../middlewares/studentAuth');

const router = express.Router();

// get login page
router.get('/login', forwardAuth, controller.getLogin);
router.post('/login', controller.postLogin);

router.get('/dashboard', requireAuth, controller.getDashboard);
router.get('/profile', requireAuth, controller.getProfile);

// Notice
router.get('/notice', requireAuth, controller.getAllNotice);

// Syllabus
router.get('/syllabus', requireAuth, controller.getAllSyllabus);

// Schedule
router.get('/schedule', requireAuth, controller.getAllSchedule);

//exam TT
router.get('/examTT', requireAuth, controller.getExamTT);


router.get('/logout', requireAuth, controller.getLogout);

// 1.5 FORGET PASSWORD
router.get('/forgot-password', forwardAuth, controller.getForgotPassword);
router.put('/forgot-password', controller.forgotPassword);

// 1.6 RESET PASSWORD
router.get('/resetpassword/:id', forwardAuth, controller.getResetPassword);
router.put('/resetpassword', controller.resetPassword);

module.exports = router;
