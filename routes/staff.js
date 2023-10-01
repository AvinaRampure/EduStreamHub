const path = require('path');
const express = require('express');
const controller = require('../controllers/staff');
const { requireAuth, forwardAuth } = require('../middlewares/staffAuth');
const multer= require('multer')

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {

      // Uploads is the Upload_folder_name
      cb(null, "public/files")
  },
  filename: function ( req, file, cb ) {
    //req.body is empty... here is where req.body.new_file_name doesn't exists
    cb( null, file.originalname );
}
})
const upload = multer({ storage:storage,});




// login page
router.get('/login', forwardAuth, controller.getLogin);
router.post('/login', controller.postLogin);

router.get('/dashboard', requireAuth, controller.getDashboard);
router.get('/profile', requireAuth, controller.getProfile);
router.get('/logout', requireAuth, controller.getLogout);

// Qr Code
router.get('/qr-code', requireAuth, controller.getqrcode);
router.get('/generateQrCode', requireAuth, controller.generateQrCode);

//Notice
router.get('/notice', requireAuth, controller.getNotice);
router.get('/getAllNotice', requireAuth, controller.getAllNotice);
router.get('/addnotice', requireAuth, controller.getNoticeInfo);
router.post('/addnotice', upload.single('file'),requireAuth, controller.postNoticeInfo);
router.get('/deleteNotice', requireAuth, controller.deleteNotice);

//Syllabus
router.get('/syllabus', requireAuth, controller.getSyllabus);
router.get('/getAllSyllabus', requireAuth, controller.getAllSyllabus);
router.get('/addSyllabus', requireAuth, controller.getSyllabusInfo);
router.post('/addSyllabus', upload.single('file'),requireAuth, controller.postSyllabusInfo);
router.get('/deleteSyllabus', requireAuth, controller.deleteSyllabus);

// schedule
router.get('/schedule', requireAuth, controller.getSchedule);
router.get('/getAllSchedule', requireAuth, controller.getAllSchedule);
router.get('/addSchedule', requireAuth, controller.getScheduleInfo);
router.post('/addSchedule', upload.single('file'),requireAuth, controller.postScheduleInfo);
router.get('/deleteSchedule', requireAuth, controller.deleteSchedule);

// FORGET PASSWORD
router.get('/forgot-password', forwardAuth, controller.getForgotPassword);
router.put('/forgot-password', controller.forgotPassword);

// RESET PASSWORD
router.get('/resetpassword/:id', forwardAuth, controller.getResetPassword);
router.put('/resetpassword', controller.resetPassword);



module.exports = router;
