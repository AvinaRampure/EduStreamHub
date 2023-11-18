const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const userModel = require('../database/userModel')
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  dateStrings: 'date',
  database: 'cumsdbms',
});

const selectID = (id) => {
  return new Promise(async (resolve, reject) => {

    const user = await userModel.findOne({
      user_id: id
    })
    if (user) return resolve(user);
    else return resolve(false);

  });
};

const requireAuth = (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, async (err, result) => {
        if (err) {
          req.flash(
            'error_msg',
            'You need to login as User in order to view that source!'
          );
          res.redirect('/unauthorized');
        } else {
          const data = await selectID(result.id);
          if (!data) {
            req.flash(
              'error_msg',
              'You need to login as USER in order to view that source!'
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
        'You need to login as ADMIN in order to view that source!'
      );
      res.redirect('/unauthorized');
    }
  } catch (error) {
    console.log(error)
  }
};

const forwardAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, result) => {
      if (err) {
        next();
      } else {
        const data = await selectID(result.id)
          .then(() => {
            req.user = result.id;
            res.redirect('/user/dashboard');
          })
          .catch(() => {
            next();
          });

      }
    });
  } else {
    next();
  }
};

module.exports = { requireAuth, forwardAuth };
