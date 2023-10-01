const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mailgun = require('mailgun-js');
const unirest = require('unirest');
const FormData = require('form-data');
const DOMAIN = process.env.DOMAIN_NAME;
const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN });
const adminModel = require('../database/adminModel');
const departmentModel = 0
const classModel = 0
const studentModel = 0
const staffModel = 0
const courseModel = 0
const timeTableModel = 0
const noticeModel = 0
const syllabusModel = 0
const scheduleModel = 0
const fs = require('fs');
const axios = require('axios')
const moment = require('moment')




// LOGIN
exports.getLogin = (req, res, next) => {
  res.render('Staff/login');
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  let errors = [];
  // const sql1 = 'SELECT * FROM staff WHERE email = ?';
  // const users = await queryParamPromise(sql1, [email]);
  const users = await staffModel.findOne({ email: email });
  if (!users) {
    errors.push({ msg: 'Invalid Email...' })
    return res.render('Staff/login', { errors });
  }

  if (!(await bcrypt.compare(password, users.password))) {
    errors.push({ msg: 'Password is Incorrect' });
    return res.status(401).render('Staff/login', { errors });
  }

  const token = jwt.sign({ id: users.st_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  res.cookie('jwt', token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.redirect('/staff/dashboard');

};

exports.getDashboard = async (req, res, next) => {

  const user = req.user;

  const data = await staffModel.findOne({ st_id: user });
  const noticeData = await noticeModel.find({dept_id: data.dept_id});
  const syllabusData = await syllabusModel.find({dept_id: data.dept_id});
  const scheduleData = await scheduleModel.find({dept_id: data.dept_id});
  res.render('Staff/dashboard', { 
    user: data,
    syllabusCount : syllabusData.length,
    scheduleCount : scheduleData.length,
    noticeCount :  noticeData.length,
     page_name: 'overview' });
};

//profile
exports.getProfile = async (req, res, next) => {
  const user = req.user;
  const data = await staffModel.findOne({ st_id: user });
  const userDOB = data.dob;

  const deptData = await departmentModel.findOne({
    dept_id: data.dept_id
  }, { _id: 0, d_name: 1 })

  // const sql3 =
  //   'SELECT cl.class_id, cl.section, cl.semester, cl.c_id, co.name FROM class AS cl, course AS co WHERE st_id = ? AND co.c_id = cl.c_id;';
  // const classData = await queryParamPromise(sql3, [data[0].st_id]);

  const cl = await classModel.find({ st_id: data.st_id }, {
    _id: 0, class_id: 1, semester: 1, section: 1, c_id: 1
  });

  const course = await courseModel.find({ c_id: cl.c_id }, { _id: 0, name: 1 });

  let classData = [];
  for (let i = 0; i < cl.length; i++) {
    let obj = {
      class_id: cl[i].class_id,
      semester: cl[i].semester,
      section: cl[i].section,
      c_id: cl[i].c_id,
      name: cl[i].name
    }
    classData.push(obj)
  }



  res.render('Staff/profile', {
    user: data,
    userDOB,
    deptData,
    classData,
    page_name: 'profile',
  });
};

exports.getStudentReport = async (req, res, next) => {
  const sql1 = 'SELECT * FROM staff WHERE st_id = ?';
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);

  const sql3 =
    'SELECT cl.class_id, cl.section, cl.semester, cl.c_id, co.name FROM class AS cl, course AS co WHERE st_id = ? AND co.c_id = cl.c_id ORDER BY cl.semester;';
  const classData = await queryParamPromise(sql3, [data[0].st_id]);

  res.render('Staff/selectClass', {
    user: data[0],
    classData,
    btnInfo: 'Students',
    page_name: 'stu-report',
  });
};

exports.selectClassReport = async (req, res, next) => {
  const sql1 = 'SELECT * FROM staff WHERE st_id = ?';
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);

  const sql3 =
    'SELECT cl.class_id, cl.section, cl.semester, cl.c_id, co.name FROM class AS cl, course AS co WHERE st_id = ? AND co.c_id = cl.c_id ORDER BY cl.semester;';
  const classData = await queryParamPromise(sql3, [data[0].st_id]);

  res.render('Staff/selectClassReport', {
    user: data[0],
    classData,
    btnInfo: 'Check Status',
    page_name: 'cls-report',
  });
};

exports.getClassReport = async (req, res, next) => {
  const courseId = req.params.id;
  const staffId = req.user;
  const section = req.query.section;
  const classData = await queryParamPromise(
    'SELECT * FROM class WHERE c_id = ? AND st_id = ? AND section = ?',
    [courseId, staffId, section]
  );
  const sql1 = 'SELECT * FROM staff WHERE st_id = ?';
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);
  res.render('Staff/getClassReport', {
    user: data[0],
    classData,
    page_name: 'cls-report',
  });
};

exports.getLogout = (req, res, next) => {
  res.cookie('jwt', '', { maxAge: 1 });
  req.flash('success_msg', 'You are logged out');
  res.redirect('/');
};

// FORGOT PASSWORD
exports.getForgotPassword = (req, res, next) => {
  res.render('Staff/forgotPassword');
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).render('Staff/forgotPassword');
  }

  let errors = [];

  const sql1 = 'SELECT * FROM staff WHERE email = ?';
  const results = await queryParamPromise(sql1, [email]);
  if (!results || results.length === 0) {
    errors.push({ msg: 'That email is not registered!' });
    return res.status(401).render('Staff/forgotPassword', {
      errors,
    });
  }

  const token = jwt.sign(
    { _id: results[0].st_id },
    process.env.RESET_PASSWORD_KEY,
    { expiresIn: '20m' }
  );

  const data = {
    from: 'noreplyCMS@mail.com',
    to: email,
    subject: 'Reset Password Link',
    html: `<h2>Please click on given link to reset your password</h2>
                <p><a href="${process.env.URL}/staff/resetpassword/${token}">Reset Password</a></p>
                <hr>
                <p><b>The link will expire in 20m!</b></p>
              `,
  };

  const sql2 = 'UPDATE staff SET resetLink = ? WHERE email = ?';
  db.query(sql2, [token, email], (err, success) => {
    if (err) {
      errors.push({ msg: 'Error In ResetLink' });
      res.render('Staff/forgotPassword', { errors });
    } else {
      mg.messages().send(data, (err, body) => {
        if (err) throw err;
        else {
          req.flash('success_msg', 'Reset Link Sent Successfully!');
          res.redirect('/staff/forgot-password');
        }
      });
    }
  });
};

exports.getResetPassword = (req, res, next) => {
  const resetLink = req.params.id;
  res.render('Staff/resetPassword', { resetLink });
};

exports.resetPassword = (req, res, next) => {
  const { resetLink, password, confirmPass } = req.body;

  let errors = [];

  if (password !== confirmPass) {
    req.flash('error_msg', 'Passwords do not match!');
    res.redirect(`/staff/resetpassword/${resetLink}`);
  } else {
    if (resetLink) {
      jwt.verify(resetLink, process.env.RESET_PASSWORD_KEY, (err, data) => {
        if (err) {
          errors.push({ msg: 'Token Expired!' });
          res.render('Staff/resetPassword', { errors });
        } else {
          const sql1 = 'SELECT * FROM staff WHERE resetLink = ?';
          db.query(sql1, [resetLink], async (err, results) => {
            if (err || results.length === 0) {
              throw err;
            } else {
              let hashed = await bcrypt.hash(password, 8);

              const sql2 = 'UPDATE staff SET password = ? WHERE resetLink = ?';
              db.query(sql2, [hashed, resetLink], (errorData, retData) => {
                if (errorData) {
                  throw errorData;
                } else {
                  req.flash(
                    'success_msg',
                    'Password Changed Successfully! Login Now'
                  );
                  res.redirect('/staff/login');
                }
              });
            }
          });
        }
      });
    } else {
      errors.push({ msg: 'Authentication Error' });
      res.render('Staff/resetPassword', { errors });
    }
  }
};

exports.getqrcode = async (req, res, next) => {


  res.render('Staff/qr-code', { page_name: 'qr-code' });
};

exports.generateQrCode = async (req, res, next) => {


  res.render('Staff/addqrcode', { page_name: 'qr-code' });
};

// Notice
exports.getNotice = async (req, res, next) => {

  const user = req.user;

  const data = await staffModel.findOne({ st_id: user });
  res.render('Staff/notice', { user: data, page_name: 'notice' });
};

exports.getAllNotice = async (req, res, next) => {

  const user = req.user;
  const data = await staffModel.findOne({ st_id: user });
  const notice = await noticeModel.find({ dept_id: data.dept_id });

  res.render('Staff/allNotice', { noticeData: notice, user: data, page_name: 'notice' });
};

exports.getNoticeInfo = async (req, res, next) => {

  const user = req.user;
  const data = await staffModel.findOne({ st_id: user });
  const department = await departmentModel.find({})
  res.render('Staff/addNotice', {
    user: data,
    departments: department
    , page_name: 'notice'
  });
};


exports.postNoticeInfo = async (req, res, next) => {

  const { name, department } = req.body;

  const dept_id = department.split("-")[0]
  const extension = req.file.filename.split('.')[1]
  var newPath = `public\\files\\${name}.${extension}`
  console.log(req.file)

  await fs.rename(req.file.path,newPath, function (err) {
    if (err) throw err;
    console.log('File Renamed.');
  });
 
  var path = newPath.split("\\")
  path.shift();
  path = path.join("\\")



  const createNotice = await noticeModel.create({
    name,
    dept_id,
    notice:path
  })


  res.redirect('/staff/notice')

};

exports.deleteNotice = async (req, res, next) => {
  const noticeName = req.query.name;

  await noticeModel.deleteOne({
    name:noticeName
  });
  res.redirect('/staff/getAllNotice');
}

// Syllabus

exports.getSyllabus = async (req, res, next) => {

  const user = req.user;

  const data = await staffModel.findOne({ st_id: user });
  res.render('Staff/syllabus', { user: data, page_name: 'syllabus' });
};

exports.getAllSyllabus = async (req, res, next) => {

  const user = req.user;
  const data = await staffModel.findOne({ st_id: user });
  const syllabus = await syllabusModel.find({ dept_id: data.dept_id });

  res.render('Staff/allSyllabus', { data: syllabus, user: data, page_name: 'syllabus' });
};

exports.deleteSyllabus = async (req, res, next) => {
  const name = req.query.name;

  await syllabusModel.deleteOne({
    name:name
  });
  res.redirect('/staff/getAllSyllabus');
}

exports.getSyllabusInfo = async (req, res, next) => {

  const user = req.user;
  const data = await staffModel.findOne({ st_id: user });
  const department = await departmentModel.find({dept_id:data.dept_id})
  const courseData = await courseModel.find({dept_id:data.dept_id})
  res.render('Staff/addSyllabus', {
    user: data,
    courses : courseData,
    departments: department
    , page_name: 'syllabus'
  });
};

exports.postSyllabusInfo = async (req, res, next) => {

  const { name, department ,course} = req.body;

  var regex= /(?<=\[).*?(?=\])/g
  let dept_id = department.match(regex)[0];
  let c_id = course.match(regex)[0];

  const extension = req.file.filename.split('.')[1]
  var newPath = `public\\files\\${name}.${extension}`
  console.log(req.file)

  await fs.rename(req.file.path,newPath, function (err) {
    if (err) throw err;
    console.log('File Renamed.');
  });
 
  var path = newPath.split("\\")
  path.shift();
  path = path.join("\\")



  const createNotice = await syllabusModel.create({
    name,
    dept_id,
    c_id,
    path
  })


  res.redirect('/staff/syllabus')

};

// Schedule

exports.getSchedule= async (req, res, next) => {

  const user = req.user;

  const data = await staffModel.findOne({ st_id: user });
  res.render('Staff/schedule', { user: data, page_name: 'schedule' });
};

exports.getAllSchedule = async (req, res, next) => {

  const user = req.user;
  const data = await staffModel.findOne({ st_id: user });
  const schedule = await scheduleModel.find({ dept_id: data.dept_id });

  res.render('Staff/allSchedule', { scheduleData: schedule, user: data, page_name: 'schedule' });
};

exports.getScheduleInfo = async (req, res, next) => {

  const user = req.user;
  const data = await staffModel.findOne({ st_id: user });
  const department = await departmentModel.find({})
  res.render('Staff/addSchedule', {
    user: data,
    departments: department
    , page_name: 'schedule'
  });
};


exports.postScheduleInfo = async (req, res, next) => {

  let { name, department ,time} = req.body;
console.log(time)

  let S_Date = moment(time).format("D MMM , YYYY")

  var regex= /(?<=\[).*?(?=\])/g
  let dept_id = department.match(regex)[0];

  const extension = req.file.filename.split('.')[1]
  var newPath = `public\\files\\${name}.${extension}`
  console.log(req.file)

  await fs.rename(req.file.path,newPath, function (err) {
    if (err) throw err;
    console.log('File Renamed.');
  });
 
  var path = newPath.split("\\")
  path.shift();
  path = path.join("\\")



  const createSchedule = await scheduleModel.create({
    name,
    dept_id,
    path,
    date:S_Date
  })


  res.redirect('/staff/schedule')

};

exports.deleteSchedule = async (req, res, next) => {
  const scheduleName = req.query.name;

  await scheduleModel.deleteOne({
    name:scheduleName
  });
  res.redirect('/staff/getAllSchedule');
}