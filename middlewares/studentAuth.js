const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const studentModel = 0


const selectID = (id) => {
  return new Promise(async (resolve, reject) => {

    const results = await studentModel.findOne({
      s_id:id
    })
    if(results){
      return resolve(results);
    }else{
      return reject(false);
    }

  });
};

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, result) => {
      if (err) {
        req.flash(
          'error_msg',
          'You need to login as STUDENT in order to view that source! ==> '
        );
        res.redirect('/unauthorized');
      } else {
        const data = await selectID(result.id);
        if (data.length === 0) {
          req.flash(
            'error_msg',
            'You need to login as STUDENT in order to view that source! abc k'
          );
          res.redirect('/unauthorized');
        } else {
          req.user = result.id;
          next();
        }
      }
    });
  } else {
    req.flash(
      'error_msg',
      'You need to login as STUDENT in order to view that source! kkk'
    );
    res.redirect('/unauthorized');
  }
};

const forwardAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, result) => {
      if (err) {
        next();
      } else {
        const data = await selectID(result.id);
        if (data.length === 0) {
          next();
        } else {
          req.user = result.id;
          res.redirect('/student/dashboard');
        }
      }
    });
  } else {
    next();
  }
};

module.exports = { requireAuth, forwardAuth };
