const jwt = require('jsonwebtoken');
const staffModel = 0


const selectID =(id) => {
  return new Promise( async (resolve, reject) => {

    const staff = await staffModel.findOne({
      st_id:id
    })
    if(staff){
      return resolve(staff)
    }else{
      return reject(false)
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
          'You need to login as STAFF in order to view that source!'
        );
        res.redirect('/unauthorized');
      } else {
        const data = await selectID(result.id);
        if (!data) {
          req.flash(
            'error_msg',
            'You need to login as STAFF in order to view that source!'
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
      'You need to login as STAFF in order to view that source!'
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
          res.redirect('/staff/dashboard');
        }
      }
    });
  } else {
    next();
  }
};

module.exports = { requireAuth, forwardAuth };
