const fs = require('fs');
const axios = require('axios')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const moment = require('moment')
const uuidv4 = require('uuid').v4;
const mailgun = require('mailgun-js');
const DOMAIN = process.env.DOMAIN_NAME;
const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN });
const adminModel = require('../database/adminModel');
const departmentModel = 0
const classModel = 0
const studentModel = 0
const staffModel = 0
const courseModel = 0
const timeTableModel = 0
const videoModel = require('../database/videoModel')
const categoryModel = require('../database/categoryModel')
const documentModel = require('../database/documentModel')
const audioModel = require('../database/audioModel');
const userModel = require('../database/userModel');
const questionModel = require('../database/questionModel');
const ratingModel = require('../database/ratingModel')
const QRCode = 0
const { promisify } = require('util');


const formate = "YYYY-MM-DD"

const admin = require('firebase-admin');
const serviceAccount = require('../utils/edustream-hub-firebase-adminsdk-rru81-b5c6445df6.json');
const { error } = require('console');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://edustream-hub.appspot.com',
});

const storage = admin.storage();
const storageRef = storage.bucket();


// 1. ADMIN
// 1.1 Login
exports.getLogin = (req, res, next) => {
  res.render('Admin/login');
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  let errors = [];

  if (!email || !password) {
    errors.push({ msg: 'Please enter all fields' });
    return res.status(400).render('Admin/login', { errors });
  }

  //find => []
  //findOne =>{ }
  const admin = await adminModel.findOne({
    email: email
  })

  if (!admin) {
    errors.push({ msg: 'Invalid email..' });
    return res.status(400).render('admin/login', { errors });
  }

  let check_password = await bcrypt.compare(password, admin.password);

  if (!check_password) {
    errors.push({ msg: 'Invalid password..' });
    return res.status(400).render('admin/login', { errors });
  }

  const token = await jwt.sign(
    { id: admin.admin_id },
    process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  res.cookie('jwt', token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.redirect('/admin/profile');
};


// 1.2 Register
// ADMIN REGISTER ==> To be commented
exports.getRegister = (req, res, next) => {

  let questions = [
    "What is your mother's maiden name?",
    "What was your first car?",
    "What elementary school did you attend?",
    "What is the name of the town where you were born?"
  ]
  res.render('Admin/register', {
    ques: questions
  });
};

exports.postRegister = async (req, res, next) => {

  const { fname, username, mobile, email, password, confirmPassword, securityQuestion, securityAnswer } = req.body;
  let errors = [];

  if (password !== confirmPassword) {
    errors.push({ msg: 'Passwords do not match' })
    return res.render('Admin/register', { errors });
  } else {

    let admin = await adminModel.findOne({
      email: email
    });

    if (admin) {
      errors.push({ msg: 'email is already registred' })
      return res.render('Admin/register', { errors });
    }

    admin = await adminModel.findOne({
      username: username
    });

    if (admin) {
      errors.push({ msg: 'username is already registred' })
      return res.render('Admin/register', { errors });
    }

    let bcrypted_password = await bcrypt.hash(password, 10);

    let register = await adminModel.create({
      admin_id: uuidv4(),
      fname: fname,
      username: username,
      mobile: mobile,
      email: email,
      password: bcrypted_password,
    });

    let addQuestion = await questionModel.create({
      question_id: securityQuestion,
      answer: securityAnswer,
      userId: register.id
    })

    req.flash('success_msg', 'You are now registered and can log in');
    return res.redirect('/admin/login');

  }
};

// 1.3 Dashboard
exports.getDashboard = async (req, res, next) => {

  const user = await adminModel.findOne({
    admin_id: req.user
  })
  res.render('Admin/dashboard', { user: user, page_name: 'overview' });
};

// 1.4 Logout
exports.getLogout = (req, res, next) => {
  res.cookie('jwt', '', { maxAge: 1 });
  req.flash('success_msg', 'You are logged out');
  res.redirect('/');
};

// 1.5 Profile
exports.getProfile = async (req, res, next) => {

  const user = await adminModel.findOne({ // { name:"",age:""}
    admin_id: req.user
  })

  const videos = await videoModel.find({});
  const documents = await documentModel.find({});
  const audios = await audioModel.find({});
  const users = await userModel.find({});

  res.render('Admin/profile', {
    videos: videos.length,
    documents: documents.length,
    audios: audios.length,
    users: users.length,
    user,
    page_name: 'profile',
  });
};

// 1.6 Forgot Password
exports.getForgotPassword = (req, res, next) => {
  res.render('Admin/forgotPassword');
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).render('Admin/forgotPassword');
  }

  let errors = [];

  const results = await adminModel.findOne({
    email: email
  })
  if (!results || results.length === 0) {
    errors.push({ msg: 'That email is not registered!' });
    res.status(401).render('Admin/forgotPassword', {
      errors,
    });
  }

  const token = jwt.sign(
    { _id: results.admin_id },
    process.env.RESET_PASSWORD_KEY,
    { expiresIn: '20m' }
  );

  const data = {
    from: 'noreplyCMS@mail.com',
    to: email,
    subject: 'Reset Password Link',
    html: `<h2>Please click on given link to reset your password</h2>
                <p><a href="${process.env.URL}/admin/resetpassword/${token}">Reset Password</a></p>
                <hr>
                <p><b>The link will expire in 20m!</b></p>
              `,
  };

  const reset = await adminModel.updateOne({
    email: email
  }, { resetLink: token })

  if (!reset) {
    errors.push({ msg: 'Error In ResetLink' });
    res.render('Admin/forgotPassword', { errors });
  }

  const mgdata = mg.messages().send(data, (err, body) => {
    if (err) throw err;
    else return body
  })

  if (mgdata) {
    req.flash('success_msg', 'Reset Link Sent Successfully!');
    res.redirect('/admin/resetPassword');
  }

  // const sql2 = 'UPDATE admin SET resetLink = ? WHERE email = ?';
  // db.query(sql2, [token, email], (err, success) => {
  //   if (err) {
  //     errors.push({ msg: 'Error In ResetLink' });
  //     res.render('Admin/forgotPassword', { errors });
  //   } else {
  //     mg.messages().send(data, (err, body) => {
  //       if (err) throw err;
  //       else {
  //         req.flash('success_msg', 'Reset Link Sent Successfully!');
  //         res.redirect('/admin/forgot-password');
  //       }
  //     });
  //   }
  // });
};

// 1.7 Reset Password
exports.getResetPassword = (req, res, next) => {
  const resetLink = req.params.id;
  res.render('Admin/resetPassword', { resetLink });
};

exports.resetPassword = (req, res, next) => {
  const { resetLink, password, confirmPass } = req.body;

  let errors = [];

  if (password !== confirmPass) {
    req.flash('error_msg', 'Passwords do not match!');
    res.redirect(`/admin/resetpassword/${resetLink}`);
  } else {
    if (resetLink) {
      jwt.verify(resetLink, process.env.RESET_PASSWORD_KEY, async (err, data) => {
        if (err) {
          errors.push({ msg: 'Token Expired!' });
          res.render('Admin/resetPassword', { errors });
        } else {
          const link = await adminModel.findOne({
            resetLink: resetLink
          })

          if (!link) {
            errors.push({ msg: 'reset link not found' });
            res.render('Admin/resetPassword', { errors });
          }
          let hashed = await bcrypt.hash(password, 10);
          const update_password = await adminModel.updateOne({
            password: hashed
          }, {
            resetLink: resetLink
          })

          if (update_password) {
            req.flash(
              'success_msg',
              'Password Changed Successfully! Login Now'
            );
            res.redirect('/admin/login');
          }
        }
      });
    } else {
      errors.push({ msg: 'Authentication Error' });
      res.render('Admin/resetPassword', { errors });
    }
  }
};

// 1.8 Settings
exports.getUpdateProfile = async (req, res, next) => {

  const user = await adminModel.findOne({
    admin_id: req.user
  })

  return res.render('Admin/updateProfile', {
    user: user,
    page_name: 'settings',
  });
};

exports.postUpdateProfile = async (req, res, next) => {

  const { username, email, fname, mobile } = req.body;

  const admin = await adminModel.findOne({
    email: email
  });

  await adminModel.updateOne({
    email: email
  }, {
    username, fname, mobile
  })


  req.flash('success_msg', 'Information Updated Successfully');
  return res.redirect('/admin/edit_profile');
};

exports.getPasswordSettings = async (req, res, next) => {
  return res.render('Admin/passwordSettings', {
    page_name: 'settings',
  });
};

exports.postPasswordSettings = async (req, res, next) => {
  const { old_password, new_password, confirm_new_password } = req.body;
  if (new_password !== confirm_new_password) {
    req.flash('error_msg', 'Passwords does not match');
    return res.redirect('/admin/password_settings');
  }

  const user = await adminModel.findOne({
    admin_id: req.user
  });

  if (!(await bcrypt.compare(old_password, user.password))) {
    req.flash('error_msg', 'Incorrect Old password');
    return res.redirect('/admin/password_settings');
  } else {
    const hashedPassword = await bcrypt.hash(new_password, 10);;

    await adminModel.updateOne({
      admin_id: req.user
    }, {
      password: hashedPassword
    })
    req.flash('success_msg', 'Password Changed Successfully');
    return res.redirect('/admin/password_settings');
  }
};


// 3. STUDENTS
// 3.1 Add student
exports.getCategory = async (req, res, next) => {

  res.render('Admin/Category/addCategory', {
    page_name: 'category'
  });
};
exports.postAddCategory = async (req, res, next) => {
  const { cname } = req.body;

  let isNamePresent = await categoryModel.findOne({
    cname: cname.toUpperCase()
  })

  if (isNamePresent) {
    req.flash('error', 'Category Is Already Present');
    return res.redirect('/admin/addCategory');
  }

  const category = await categoryModel.create({
    id: uuidv4(),
    cname: cname.toUpperCase(),
    userId: req.user
  })

  req.flash('success_msg', 'Student added successfully');
  res.redirect('/admin/profile');
};

exports.getAllCategory = async (req, res, next) => {

  let data = await categoryModel.find({ userId: req.user });

  res.render('Admin/Category/getCategory', {
    data,
    page_name: 'category',
  });

};

exports.deleteCategory = async (req, res, next) => {

  const id = req.params.id;

  let checkCategory = await categoryModel.find({ userId: req.user, id });
  if (checkCategory.length == 0) {
    req.flash('error', 'You Can"t Delete Category Of Other Admins');
    res.redirect('/admin/getCategory');
    return
  }

  await categoryModel.deleteOne({ id });
  res.redirect('/admin/getCategory');

}
// 3.2 Get students on query
exports.getRelevantStudent = async (req, res, next) => {

  const results = await departmentModel.find({});
  let departments = [];
  for (let i = 0; i < results.length; ++i) {
    departments.push(results[i].dept_id);
  }
  let year = ["First Year", "Second Year", "Third Year", "Forth Year"]

  res.render('Admin/Student/deptSelect', {
    years: year,
    departments: departments,
    page_name: 'students',
  });
};

exports.postRelevantStudent = async (req, res, next) => {
  let { year, department } = req.body;
  if (year === 'None' && department === 'None') {
    const results = await studentModel.find({});

    res.render('Admin/Student/getStudent', {
      data: results,
      page_name: 'students',
    });
  } else if (year == "None") {

    const results = await studentModel.find({ dept_id: department });
    res.render('Admin/Student/getStudent', {
      data: results,
      page_name: 'students',
    });
  } else if (department === 'None') {
    const results = await studentModel.find({ year: year });
    res.render('Admin/Student/getStudent', {
      data: results,
      page_name: 'students',
    });
  } else if (year != 'None' && department != 'None') {

    const results = await studentModel.find({
      year: year,
      dept_id: department
    })

    res.render('Admin/Student/getStudent', {
      data: results,
      page_name: 'students',
    });
  }
};

// 3.3 Get all students
exports.getAllStudent = async (req, res, next) => {

  const results = await studentModel.find({});
  res.render('Admin/Student/getStudent', {
    data: results,
    page_name: 'students',
  });
};

// 3.4 Modify existing students
exports.getStudentSettings = async (req, res, next) => {
  const studentEmail = req.params.id;
  const studentData = await studentModel.find({ email: studentEmail });
  const address = studentData[0].s_address.split('-');
  studentData[0].address = address;
  const results = await departmentModel.find({});
  let departments = [];
  for (let i = 0; i < results.length; ++i) {
    departments.push(results[i].dept_id);
  }
  res.render('Admin/Student/setStudent', {
    studentData: studentData,
    departments: departments,
    page_name: 'students',
  });
};

exports.deleteStudent = async (req, res, next) => {
  const studentEmail = req.params.id;

  await studentModel.deleteOne({
    email: studentEmail
  });
  res.redirect('/admin/getStudent');
}

exports.postStudentSettings = async (req, res, next) => {
  const {
    old_email,
    email,
    dob,
    name,
    gender,
    department,
    address,
    city,
    postalCode,
    contact,
  } = req.body;
  const password = dob.toString().split('-').join('');
  const hashedPassword = await bcrypt.hash(password, 10);
  const sql1 =
    'select count(*) as `count`, section from student where section = (select max(section) from student where dept_id = ?) AND dept_id = ?';
  const results = await queryParamPromise(sql1, [department, department]);
  let section = 1;
  if (results[0].count !== 0) {
    if (results[0].count == SECTION_LIMIT) {
      section = results[0].section + 1;
    } else {
      section = results[0].section;
    }
  }
  const sql2 =
    'UPDATE STUDENT SET s_name = ?, gender = ?, dob = ?,email = ?, s_address = ?, contact = ?, password = ?, section = ?, dept_id = ? WHERE email = ?';
  await queryParamPromise(sql2, [
    name,
    gender,
    dob,
    email,
    address + '-' + city + '-' + postalCode,
    contact,
    hashedPassword,
    section,
    department,
    old_email,
  ]);
  req.flash('success_msg', 'Student updated successfully');
  res.redirect('/admin/getAllStudents');
};

// 4. CLASSES

// 4.1 Select Class
exports.getAllVideo = async (req, res, next) => {

  let data = await videoModel.find({userId : req.user});

  for (let i = 0; i < data.length; i++) {
    let date = data[i]['createdAt']
    data[i]['uploadedAt'] = moment(date).format("ll");


    if (data[i]['visibility'] == "Public") {
      data[i]['videoStatus'] = "Published"
    } else {
      data[i]['videoStatus'] = "Uploaded"
    }

    let ratings = await ratingModel.find({ mediaId: data[i].id });
    let sum = 0
    let averageRating = 0

    if (ratings.length) {
        for (let obj of ratings) {
            sum += obj.rating
        }

        averageRating = sum / ratings.length;
    }
    data[i]['rating'] = averageRating;
    data[i]['ratingCount'] = ratings.length

  }

  res.render('Admin/Video/getVideos', {
    data,
    page_name: 'video',
  });
};

// 4.2 Add class
exports.getVideo = async (req, res, next) => {

  const categories = await categoryModel.find({});
  const visibility = ["Public", "Unlisted"]

  res.render('Admin/Video/addVideo', {
    page_name: 'videos',
    categories,
    visibility
  });
};

exports.postVideo = async (req, res, next) => {

  let { videoName, description, category, visibility } = req.body;
  let imageUrl;
  let videoUrl;

  const videoData = await videoModel.findOne({
    name: videoName,
    category
  });

  if (videoData) {
    req.flash('error', 'Name Is Already Exist');
    res.redirect('/admin/addVideo');
    return;
  }

  try {
    for (let obj of req.files) {
      if (obj.fieldname == 'videoFile') {
        let path = `videos/${obj.originalname}`;
        const result = await upload(obj, path)
        videoUrl = result;
      }

      if (obj.fieldname == 'thumbnailFile') {
        let path = `images/${obj.originalname}`;
        const result = await upload(obj, path);
        imageUrl = result;
      }
    }


  } catch (error) {
    console.error('Error during file upload:', error);
    req.flash('error', 'File upload failed');
    res.redirect('/admin/addVideo');
  }

  let obj = {
    id: uuidv4(),
    name: videoName,
    category,
    description,
    imageUrl,
    videoUrl,
    visibility,
    userId: req.user
  };
  let result = await videoModel.create(obj);

  res.redirect('/admin/getAllVideo');
};


// 4.3 Modify existing classes
exports.getEditVideo = async (req, res, next) => {
  const videoId = req.params.id;

  const videoData = await videoModel.find({
    id: videoId
  })

  const categories = await categoryModel.find({});
  const visibility = ["Public", "Unlisted"];



  res.render('Admin/Video/updateVideo', {
    categories,
    visibility,
    videoData: videoData[0],
    page_name: 'videos',
  });
};

exports.postEditVideo = async (req, res, next) => {
  console.log("body", req.user, req.body);
  let videoId = req.params.id;
  let { videoName, description, category, visibility } = req.body;
  let imageUrl;

  let checkVideo = await videoModel.findOne({ id: videoId, userId: req.user });

  if (!checkVideo) {
    req.flash('error', 'You Can"t Update other admin video');
    res.redirect(`/admin/edit/video/${videoId}`);
  }

  try {
    for (let obj of req.files) {

      if (obj.fieldname == 'thumbnailFile') {
        let path = `images/${obj.originalname}`;
        const result = await upload(obj, path);
        imageUrl = result;
      }
    }

  } catch (error) {
    console.error('Error during file upload:', error);
    req.flash('error', 'File upload failed');
    res.redirect(`/admin/edit/video/${videoId}`);
  }

  let obj = {
    name: videoName,
    category,
    description,
    visibility
  };

  if (imageUrl) {
    obj['imageUrl'] = imageUrl
  }


  let udpadteVideo = await videoModel.updateOne({ id: videoId }, obj);

  req.flash('success_msg', 'Video updated successfully!');
  res.redirect('/admin/getAllVideo');
};

exports.deleteVideo = async (req, res, next) => {
  const id = req.params.id;

  let checkVideo = await videoModel.find({ userId: req.user, id });
  if (checkVideo.length == 0) {
    req.flash('error', 'You Can"t Delete Video Of Other Admins');
    res.redirect('/admin/getAllVideo');
    return
  }

  await videoModel.deleteOne({ id });
  res.redirect('/admin/getAllVideo');
}

// 5. DEPARTMENTS
// 5.1 Select department
exports.getAllDoc = async (req, res, next) => {
  let data = await documentModel.find({});

  for (let i = 0; i < data.length; i++) {
    let date = data[i]['createdAt']
    data[i]['uploadedAt'] = moment(date).format("ll");


    if (data[i]['visibility'] == "Public") {
      data[i]['docStatus'] = "Published"
    } else {
      data[i]['docStatus'] = "Uploaded"
    }
  }

  res.render('Admin/Document/getAllDoc', {
    data,
    page_name: 'documents',
  });
};

// 5.2 Add department
exports.getAddDoc = async (req, res, next) => {
  const categories = await categoryModel.find({});
  const visibility = ["Public", "Unlisted"]
  res.render('Admin/Document/addDoc', { page_name: 'documents', categories, visibility });
};

exports.postAddDoc = async (req, res, next) => {
  console.log("body", req.body, req.user);
  let { fName, description, category, visibility } = req.body;
  let imageUrl;
  let docUrl;

  const docData = await documentModel.findOne({
    name: fName,
    category,
  });

  if (docData) {
    req.flash('error', 'Name Is Already Exist');
    res.redirect('/admin/addDoc');
    return;
  }

  try {
    for (let obj of req.files) {
      if (obj.fieldname == 'File') {
        let path = `Files/${obj.originalname}`;
        const result = await upload(obj, path)
        docUrl = result;
      }

      if (obj.fieldname == 'coverImage') {
        let path = `images/${obj.originalname}`;
        const result = await upload(obj, path);
        imageUrl = result;
      }
    }

  } catch (error) {
    console.error('Error during file upload:', error);
    req.flash('error', 'File upload failed');
    res.redirect('/admin/addVideo');
  }

  let obj = {
    id: uuidv4(),
    name: fName,
    category,
    description,
    imageUrl,
    docUrl,
    visibility,
    userId: req.user
  };

  let result = await documentModel.create(obj);

  console.log(result);
  res.redirect('/admin/getAllDoc');
};

// 5.3 Modify existing department
exports.getEditFile = async (req, res, next) => {
  const docId = req.params.id;

  const docData = await documentModel.find({
    id: docId
  });

  const categories = await categoryModel.find({});
  const visibility = ["Public", "Unlisted"];



  res.render('Admin/Document/updateDoc', {
    categories,
    visibility,
    docData: docData[0],
    page_name: 'documents',
  });
};

exports.postEditFile = async (req, res, next) => {
  console.log("body", req.user, req.body);
  let docId = req.params.id;
  let { docName, description, category, visibility } = req.body;
  let imageUrl;

  let checkDoc = await documentModel.findOne({ id: docId, userId: req.user });

  if (!checkDoc) {
    req.flash('error', 'You Can"t Update other admin pdf');
    res.redirect(`/admin/edit/file/${docId}`);
  }

  try {
    for (let obj of req.files) {

      if (obj.fieldname == 'thumbnailFile') {
        let path = `images/${obj.originalname}`;
        const result = await upload(obj, path);
        imageUrl = result;
      }
    }

  } catch (error) {
    console.error('Error during file upload:', error);
    req.flash('error', 'File upload failed');
    res.redirect(`/admin/edit/file/${docId}`);
  }

  let obj = {
    name: docName,
    category,
    description,
    visibility
  };

  if (imageUrl) {
    obj['imageUrl'] = imageUrl
  }

  console.log("obj", obj);

  let udpadteDoc = await documentModel.updateOne({ id: docId }, obj);

  req.flash('success_msg', 'Document updated successfully!');
  res.redirect('/admin/getAllDoc');

};

exports.deleteFile = async (req, res, next) => {
  const id = req.params.id;

  let checkFile = await documentModel.find({ userId: req.user, id });
  if (checkFile.length == 0) {
    req.flash('error', 'You Can"t Delete File Of Other Admins');
    res.redirect('/admin/getAllDoc');
    return
  }

  await documentModel.deleteOne({ id });
  res.redirect('/admin/getAllDoc');
}

// 6. COURSE
// 6.1 Get all courses
exports.getAllAudios = async (req, res, next) => {
  console.log("user", req.user)
  let data = await audioModel.find({ userId: req.user });

  for (let i = 0; i < data.length; i++) {
    let date = data[i]['createdAt']
    data[i]['uploadedAt'] = moment(date).format("ll");


    if (data[i]['visibility'] == "Public") {
      data[i]['audioStatus'] = "Published"
    } else {
      data[i]['audioStatus'] = "Uploaded"
    }

    let ratings = await ratingModel.find({ mediaId: data[i].id });
    let sum = 0
    let averageRating = 0

    if (ratings.length) {
        for (let obj of ratings) {
            sum += obj.rating
        }

        averageRating = sum / ratings.length;
    }
    data[i]['rating'] = averageRating;
    data[i]['ratingCount'] = ratings.length
  }

  res.render('Admin/Audio/getAudio', {
    data,
    page_name: 'audios',
  });

};


// 6.3 Add course
exports.getAddAudio = async (req, res, next) => {
  const categories = await categoryModel.find({});
  const visibility = ["Public", "Unlisted"]
  res.render('Admin/Audio/addAudio', {
    categories,
    visibility,
    page_name: 'audios',
  });
};

exports.postAddAudio = async (req, res, next) => {

  let { audioName, description, category, visibility } = req.body;
  let imageUrl;
  let audioUrl;

  const audioData = await audioModel.findOne({
    name: audioName,
    category,
  });

  if (audioData) {
    req.flash('error', 'Name Is Already Exist');
    res.redirect('/admin/addAudio');
    return;
  }

  try {
    for (let obj of req.files) {
      if (obj.fieldname == 'audioFile') {
        let path = `audios/${obj.originalname}`;
        const result = await upload(obj, path)
        audioUrl = result;
      }

      if (obj.fieldname == 'thumbnailFile') {
        let path = `images/${obj.originalname}`;
        const result = await upload(obj, path);
        console.log(result);
        imageUrl = result;
      }
    }

  } catch (error) {
    console.error('Error during file upload:', error);
    req.flash('error', 'File upload failed');
    res.redirect('/admin/addVideo');
  }


  let obj = {
    id: uuidv4(),
    name: audioName,
    category,
    description,
    imageUrl,
    audioUrl,
    visibility,
    userId: req.user
  };

  console.log("obj", obj);

  let result = await audioModel.create(obj);

  res.redirect('/admin/profile');
};

exports.deleteAudio = async (req, res, next) => {

  const id = req.params.id;

  let checkAudio = await audioModel.find({ userId: req.user, id });
  if (checkAudio.length == 0) {
    req.flash('error', 'You Can"t Delete Audio Of Other Admins');
    res.redirect('/admin/getAllAudios');
    return
  }

  await audioModel.deleteOne({ id });
  res.redirect('/admin/getAllAudios');

}
// 6.4 Modify existing courses
exports.getEditAudio = async (req, res, next) => {
  const audioId = req.params.id;

  const audioData = await audioModel.find({
    id: audioId
  })
  console.log("audioData", audioData);

  const categories = await categoryModel.find({});
  const visibility = ["Public", "Unlisted"];



  res.render('Admin/Audio/updateAudio', {
    categories,
    visibility,
    audioData: audioData[0],
    page_name: 'audios',
  });
};

exports.postEditAudio = async (req, res, next) => {
  console.log("body", req.user, req.body);
  let audioId = req.params.id;
  let { audioName, description, category, visibility } = req.body;
  let imageUrl;

  let checkVideo = await audioModel.findOne({ id: audioId, userId: req.user });

  if (!checkVideo) {
    req.flash('error', 'You Can"t Update other admin Audio');
    res.redirect(`/admin/edit/audio/${audioId}`);
  }

  try {
    for (let obj of req.files) {

      if (obj.fieldname == 'thumbnailFile') {
        let path = `images/${obj.originalname}`;
        const result = await upload(obj, path);
        imageUrl = result;
      }
    }

  } catch (error) {
    console.error('Error during file upload:', error);
    req.flash('error', 'File upload failed');
    res.redirect(`/admin/edit/audio/${audioId}`);
  }

  let obj = {
    name: audioName,
    category,
    description,
    visibility
  };

  if (imageUrl) {
    obj['imageUrl'] = imageUrl
  }

  console.log("obj", obj);

  let udpadteAudio = await audioModel.updateOne({ id: audioId }, obj);

  req.flash('success_msg', 'Audio updated successfully!');
  res.redirect('/admin/getAllAudios');
};


exports.postUpload = async (req, res, next) => {
  const videoFile = req.file;
  console.log(videoFile, "fille")
  // Create a reference to the video file in Firebase Storage.
  const fileRef = storageRef.file(`videos/${videoFile.originalname}`); // Replace with your desired storage path

  const uploadStream = fileRef.createWriteStream();

  uploadStream.on('error', (error) => {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  });

  uploadStream.on('finish', async () => {
    // Handle successful upload here
    console.log('Upload successful');

    // Get the download URL for the video file.
    try {
      const [downloadURL] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '01-01-2030', // Set an expiration date or duration
      });

      // Return the download URL to the client.
      console.log('Download URL:', downloadURL);
      res.status(200).json({ downloadURL });
    } catch (error) {
      console.error('Error getting download URL:', error);
      res.status(500).json({ error: 'Download URL retrieval failed' });
    }
  });

  // Write the video file's buffer to Firebase Storage
  uploadStream.end(videoFile.buffer);
};


exports.postUploadImage = async (req, res, next) => {
  const imageFile = req.file;
  console.log(imageFile, "fille")
  // Create a reference to the video file in Firebase Storage.

};

async function upload(fileData, path) {
  try {
    // Wrap the uploadStream events in promises for better handling
    return new Promise((resolve, reject) => {
      const fileRef = storageRef.file(path);

      const uploadStream = fileRef.createWriteStream();

      uploadStream.on('error', (error) => {
        console.error('Upload error:', error);
        reject(error);
      });

      uploadStream.on('finish', async () => {
        console.log('Upload successful', path);

        // Get the download URL for the uploaded file
        try {
          const [downloadURL] = await fileRef.getSignedUrl({
            action: 'read',
            expires: '01-01-2030', // Set an expiration date or duration
          });
          console.log('Download URL:', downloadURL);
          resolve(downloadURL);
        } catch (error) {
          console.error('Error getting download URL:', error);
          reject(error);
        }
      })

      // Write the file's buffer to Firebase Storage
      uploadStream.end(fileData.buffer);
    }).then((result) => {
      return result
    }).catch((error) => {
      console.log("123232323error", error)
    })

  } catch (error) {
    console.error('Upload function error:', error);
    throw error; // Rethrow the error to be caught in the calling function
  }
}

exports.allUsers = async (req, res, next) => {
  console.log("user", req.user)
  let data = await userModel.find({});

  res.render('Admin/User/allUser', {
    data,
    page_name: 'users',
  });

};