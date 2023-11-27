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


// 1.8 Settings
router.get('/edit_profile', requireAuth, controller.getUpdateProfile);
router.post('/edit_profile', requireAuth, controller.postUpdateProfile);
router.get('/password_settings', requireAuth, controller.getPasswordSettings);
router.post('/password_settings', requireAuth, controller.postPasswordSettings);


// Category 
router.get('/addCategory', requireAuth, controller.getCategory);
router.post('/addCategory',requireAuth, controller.postAddCategory);
router.get('/getCategory', requireAuth,controller.getAllCategory);
router.get('/edit/deleteCategory/:id', requireAuth, controller.deleteCategory);


// Video
router.get('/getAllVideo', requireAuth, controller.getAllVideo);
router.get('/addVideo', requireAuth, controller.getVideo);
router.post('/addVideo',requireAuth ,upload.any(), controller.postVideo);
router.get('/edit/video/:id', requireAuth, controller.getEditVideo);
router.post('/edit/video/:id', requireAuth,upload.any() , controller.postEditVideo);
router.get('/edit/deleteVideo/:id', requireAuth, controller.deleteVideo);

// Documents
router.get('/getAllDoc', requireAuth, controller.getAllDoc);
router.get('/addDoc', requireAuth, controller.getAddDoc);
router.post('/addDoc', requireAuth,upload.any() , controller.postAddDoc);
router.get('/edit/file/:id', requireAuth, controller.getEditFile);
router.post('/edit/file/:id', requireAuth, upload.any() ,controller.postEditFile);
router.get('/edit/deleteFile/:id', requireAuth, controller.deleteFile);

//Audio
router.get('/getAllAudios', requireAuth, controller.getAllAudios);
router.get('/addAudio', requireAuth, controller.getAddAudio);
router.post('/addAudio', requireAuth,upload.any(), controller.postAddAudio);
router.get('/edit/audio/:id', requireAuth, controller.getEditAudio);
router.post('/edit/audio/:id', requireAuth,upload.any() , controller.postEditAudio);
router.get('/edit/deleteAudio/:id', requireAuth, controller.deleteAudio);


//upload
router.post('/uploadVideo',upload.single('videoFile'), controller.postUpload);
router.post('/uploadImage',upload.single('thumbnailFile'), controller.postUploadImage);


router.get('/allUsers', requireAuth, controller.allUsers);


module.exports = router;


// get , post , put , delete , fetch

// globle , route level