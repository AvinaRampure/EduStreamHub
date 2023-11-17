const express = require('express');
const controller = require('../controllers/admin');
const { requireAuth, forwardAuth } = require('../middlewares/adminAuth');
const multer = require('multer')
const router = express.Router();

const storage = multer.memoryStorage(); // Store the file in memory before uploading to Firebase
const upload = multer({ storage: storage });



// 1. ADMIN

// 1.1 Login
router.get('/login', forwardAuth, controller.getLogin);
router.post('/login', controller.postLogin);

// 1.2 Register
router.get('/register', controller.getRegister);
router.post('/register', controller.postRegister);

// 1.3 Dashboard
router.get('/dashboard', requireAuth, controller.getDashboard);

// 1.4 Logout
router.get('/logout', requireAuth, controller.getLogout);

// 1.5 Profile
router.get('/profile', requireAuth, controller.getProfile);

// 1.6 Forgot password
router.get('/forgot-password', forwardAuth, controller.getForgotPassword);
router.put('/forgot-password', forwardAuth, controller.forgotPassword);

// 1.7 Reset Password
router.get('/resetpassword/:id', forwardAuth, controller.getResetPassword);
router.put('/resetpassword', forwardAuth, controller.resetPassword);

// 1.8 Settings
router.get('/info_settings', requireAuth, controller.getInfoSettings);
router.post('/info_settings', requireAuth, controller.postInfoSettings);
router.get('/password_settings', requireAuth, controller.getPasswordSettings);
router.post('/password_settings', requireAuth, controller.postPasswordSettings);

// 2.STAFFS
// 2.1 Add staff
router.get('/addStaff', requireAuth, controller.getAddStaff);
router.post('/addStaff', requireAuth, controller.postAddStaff);
// 2.2 Get staffs on query
router.get('/getStaff', requireAuth, controller.getRelevantStaff);
router.post('/getStaff', requireAuth, controller.postRelevantStaff);
// 2.3 Get all staffs
router.get('/getAllStaffs', requireAuth, controller.getAllStaff);
// 2.4 Modify existing staffs
router.get('/settings/staff/:id', requireAuth, controller.getStaffSettings);
router.post('/settings/staff', requireAuth, controller.postStaffSettings);
router.get('/settings/deleteStaff/:id', requireAuth, controller.deleteStaff);

// 3.STUDENTS
// 3.1 Add Student
router.get('/addCategory', requireAuth, controller.getCategory);
router.post('/addCategory',requireAuth, controller.postAddCategory);
router.get('/getCategory', requireAuth,controller.getAllCategory);
router.get('/edit/deleteCategory/:id', requireAuth, controller.deleteCategory);
// 3.2 Get Students on query
router.get('/getStudent', requireAuth, controller.getRelevantStudent);
router.post('/getStudent', requireAuth, controller.postRelevantStudent);
// 3.3 Get all Students
router.get('/getAllStudents', requireAuth, controller.getAllStudent);
// 3.4 Modify existing students
router.get('/settings/student/:id', requireAuth, controller.getStudentSettings);
router.post('/settings/student', requireAuth, controller.postStudentSettings);
router.get('/settings/deleteStudent/:id', requireAuth, controller.deleteStudent);

// 4.CLASSES (subjects mapping courses ,staffs and section)
// 4.1 Select class
router.get('/getAllVideo', requireAuth, controller.getAllVideo);
// 4.2 Add class
router.get('/addVideo', requireAuth, controller.getVideo);
router.post('/addVideo',requireAuth ,upload.any(), controller.postVideo);
// 4.3 Modify existing classes
router.get('/edit/video/:id', requireAuth, controller.getEditVideo);
router.post('/edit/video/:id', requireAuth,upload.any() , controller.postEditVideo);
router.get('/edit/deleteVideo/:id', requireAuth, controller.deleteVideo);

// 5.DEPARTMENTS
// 5.1 Select department
router.get('/getAllDoc', requireAuth, controller.getAllDoc);
// 5.2 Add department
router.get('/addDoc', requireAuth, controller.getAddDoc);
router.post('/addDoc', requireAuth,upload.any() , controller.postAddDoc);
// 5.3 Modify existing department
router.get('/edit/file/:id', requireAuth, controller.getEditFile);
router.post('/edit/file/:id', requireAuth, upload.any() ,controller.postEditFile);
router.get('/edit/deleteFile/:id', requireAuth, controller.deleteFile);

// 6.COURSES
// 6.1 Get all courses
router.get('/getAllAudios', requireAuth, controller.getAllAudios);
// 6.2 Get courses on query
router.get('/getCourse', requireAuth, controller.getRelevantCourse);
router.post('/getCourse', requireAuth, controller.postRelevantCourse);
// 6.3 Add course
router.get('/addAudio', requireAuth, controller.getAddAudio);
router.post('/addAudio', requireAuth,upload.any(), controller.postAddAudio);
// 6.4 Modify existing courses
router.get('/edit/audio/:id', requireAuth, controller.getEditAudio);
router.post('/edit/audio/:id', requireAuth,upload.any() , controller.postEditAudio);
router.get('/edit/deleteAudio/:id', requireAuth, controller.deleteAudio);

// Qr Code
router.get('/addExamTT',requireAuth, controller.getGenerateQr);
router.post('/addExamTT',upload.single('videoFile'),requireAuth, controller.generateQr);
router.get('/getExamTT',requireAuth, controller.getAllQr);
router.get('/deleteExamTT',requireAuth, controller.deleteQr);


//upload

router.post('/uploadVideo',upload.single('videoFile'), controller.postUpload);
router.post('/uploadImage',upload.single('thumbnailFile'), controller.postUploadImage);


router.get('/allUsers', requireAuth, controller.allUsers);

// router.get('/token', controller.getToken);
module.exports = router;


// get , post , put , delete , fetch

// globle , route level