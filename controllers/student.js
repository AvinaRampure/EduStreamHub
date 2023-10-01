const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
const noticeModel = 0
const syllabusModel = 0
const scheduleModel = 0






exports.getLogin = (req, res, next) => {
  res.render('Student/login');
};

exports.postLogin = async(req, res) => {
  try {
    const { email, password } = req.body;
    let errors = [];

    if (!email || !password) {
      errors.push({ msg: 'Please enter all fields' });
      return res.status(400).render('Student/login', { errors });
    }

    const student = await studentModel.findOne({
      email:email
    })
    
    if(!student){
      errors.push({ msg: 'Invalid Email ..' });
      res.status(401).render('Student/login', { errors });
    }

    let check_password = await bcrypt.compare(password, student.password).then(function (result) {
      return true;
    });

    if(!check_password){
      errors.push({ msg: 'Invalid Password ..' });
      res.status(401).render('Student/login', { errors });
    }


  const token = jwt.sign({ id: student.s_id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRE,
        });

        res.cookie('jwt', token, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
        });
  res.redirect('/student/dashboard');
    
  } catch (err) {
    throw err;
  }
};

exports.getDashboard = async (req, res, next) => {

  const data = await studentModel.findOne({
    s_id:req.user
  })

  const noticeData = await noticeModel.find({dept_id: data.dept_id});
  const syllabusData = await syllabusModel.find({dept_id: data.dept_id});
  const scheduleData = await scheduleModel.find({dept_id: data.dept_id});

  res.render('Student/dashboard', {
    name: data.s_name,
    syllabusCount : syllabusData.length,
    scheduleCount : scheduleData.length,
    noticeCount :  noticeData.length,
    page_name: 'overview',
  });


};

exports.getProfile = async (req, res, next) => {


  const profileData =  await studentModel.findOne({
    s_id:req.user
  })
  const deptName = await departmentModel.findOne({
    dept_id:profileData.dept_id
  },{
    _id:0,d_name:1
  })

  const dobs = new Date(profileData.dob);
  const jd = new Date(profileData.joining_date);

  let dob =
    dobs.getDate() + '/' + (dobs.getMonth() + 1) + '/' + dobs.getFullYear();
  let jds = jd.getDate() + '/' + (jd.getMonth() + 1) + '/' + jd.getFullYear();

  return res.render('Student/profile', {
    data: profileData,
    page_name: 'profile',
    dname: deptName.d_name,
    dob,
    jds,
  });
};

exports.getLogout = (req, res, next) => {
  res.cookie('jwt', '', { maxAge: 1 });
  req.flash('success_msg', 'You are logged out');
  res.redirect('/');
};

// FORGOT PASSWORD
exports.getForgotPassword = (req, res, next) => {
  res.render('Student/forgotPassword');
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).render('Student/forgotPassword');
  }

  let errors = [];

  const sql1 = 'SELECT * FROM student WHERE email = ?';
  const results = await queryParamPromise(sql1, [email]);
  if (!results || results.length === 0) {
    errors.push({ msg: 'That email is not registered!' });
    return res.status(401).render('Student/forgotPassword', {
      errors,
    });
  }

  const token = jwt.sign(
    { _id: results[0].s_id },
    process.env.RESET_PASSWORD_KEY,
    { expiresIn: '20m' }
  );

  const data = {
    from: 'noreplyCMS@mail.com',
    to: email,
    subject: 'Reset Password Link',
    html: `<h2>Please click on given link to reset your password</h2>
                <p><a href="${process.env.URL}/student/resetpassword/${token}">Reset Password</a></p>
                <hr>
                <p><b>The link will expire in 20m!</b></p>
              `,
  };

  const sql2 = 'UPDATE student SET resetLink = ? WHERE email = ?';
  db.query(sql2, [token, email], (err, success) => {
    if (err) {
      errors.push({ msg: 'Error In ResetLink' });
      res.render('Student/forgotPassword', { errors });
    } else {
      mg.messages().send(data, (err, body) => {
        if (err) throw err;
        else {
          req.flash('success_msg', 'Reset Link Sent Successfully!');
          res.redirect('/student/forgot-password');
        }
      });
    }
  });
};

exports.getResetPassword = (req, res, next) => {
  const resetLink = req.params.id;
  res.render('Student/resetPassword', { resetLink });
};

exports.resetPassword = (req, res, next) => {
  const { resetLink, password, confirmPass } = req.body;

  let errors = [];

  if (password !== confirmPass) {
    req.flash('error_msg', 'Passwords do not match!');
    res.redirect(`/student/resetpassword/${resetLink}`);
  } else {
    if (resetLink) {
      jwt.verify(resetLink, process.env.RESET_PASSWORD_KEY, (err, data) => {
        if (err) {
          errors.push({ msg: 'Token Expired!' });
          res.render('Student/resetPassword', { errors });
        } else {
          const sql1 = 'SELECT * FROM student WHERE resetLink = ?';
          db.query(sql1, [resetLink], async (err, results) => {
            if (err || results.length === 0) {
              throw err;
            } else {
              let hashed = await bcrypt.hash(password, 8);

              const sql2 =
                'UPDATE student SET password = ? WHERE resetLink = ?';
              db.query(sql2, [hashed, resetLink], (errorData, retData) => {
                if (errorData) {
                  throw errorData;
                } else {
                  req.flash(
                    'success_msg',
                    'Password Changed Successfully! Login Now'
                  );
                  res.redirect('/student/login');
                }
              });
            }
          });
        }
      });
    } else {
      errors.push({ msg: 'Authentication Error' });
      res.render('Student/resetPassword', { errors });
    }
  }
};


// notice

exports.getAllNotice = async (req, res, next) => {

  const user = req.user;
  const data = await studentModel.findOne({ s_id: user });
  const notice = await noticeModel.find({ dept_id: data.dept_id });

  const type =  [];
  for(let i of notice){
    const ex = i.notice.split(".")[1]
    type.push(ex)
  }
  console.log(type)

  res.render('Student/notice', { data: notice, exType:type ,user: data, page_name: 'notice' });
};

exports.getAllSyllabus = async (req, res, next) => {

  const user = req.user;
  const data = await studentModel.findOne({ s_id: user });
  const syllabus = await syllabusModel.find({ dept_id: data.dept_id });

  const type =  [];
  for(let i of syllabus){
    const ex = i.path.split(".")[1]
    type.push(ex)
  }

  res.render('Student/syllabus', { data: syllabus, user: data,exType:type, page_name: 'syllabus' });
};

exports.getAllSchedule = async (req, res, next) => {

  const user = req.user;
  const filter = req.query.sort;
  let f_sort = 1;

  if(filter == "Oldest"){
    f_sort = -1
  }


  const data = await studentModel.findOne({ s_id: user });
  const schedule = await scheduleModel.find({ dept_id: data.dept_id }).sort({date:f_sort});

  const type =  [];
  for(let i of schedule){
    const ex = i.path.split(".")[1]
    type.push(ex)
  }

  res.render('Student/schedule', { scheduleData: schedule, exType:type,user: data, page_name: 'schedule' });
};

exports.getExamTT = async (req, res, next) => {

  const user = req.user;
  const data = await studentModel.findOne({ s_id: user });
  const timeTable = await timeTableModel.find({ dept_id: data.dept_id });

  res.render('Student/examTT', { timeTable, user: data, page_name: 'exam' });

}