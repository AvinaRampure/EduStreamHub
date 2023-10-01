const path = require('path');
const env = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');
const cors = require('cors');
const methodOverride = require('method-override');
const mongoose =  require('mongoose')
const multer = require('multer')



env.config();
const app = express();


app.use(cors()); // global middleware
app.use(methodOverride('_method'));


app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(
  session({
    secret: process.env.SESSION_SECRET='secret',
    resave: true,
    saveUninitialized: true,
  })
);

app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

const adminRoutes = require('./routes/admin');
const staffRoutes = require('./routes/staff');
const studentRoutes = require('./routes/student');
const homeRoutes = require('./routes/home');


app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({limit: '1mb'}));
app.use(cookieParser());


app.use('/admin', adminRoutes);
app.use('/staff', staffRoutes);
app.use('/student', studentRoutes);
app.use('/', homeRoutes);

// Home Page
app.use(homeRoutes);


mongoose.connect("mongodb://localhost:27017")
.then(() => console.log("mongoDB is connected.."))
.catch((err) => console.log(err))

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started @ ${PORT}`);
});
