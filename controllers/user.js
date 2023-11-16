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
const userModel = require('../database/userModel');
const videoModel = require('../database/videoModel');
const audioModel = require('../database/audioModel');
const documentModel = require('../database/documentModel');
const ratingModel = require('../database/ratingModel');

exports.getLogin = (req, res, next) => {
    res.render('User/login');
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
    const user = await userModel.findOne({
        email: email
    })

    if (!user) {
        errors.push({ msg: 'Invalid email..' });
        return res.status(400).render('user/login', { errors });
    }

    let check_password = await bcrypt.compare(password, user.password);

    if (!check_password) {
        errors.push({ msg: 'Invalid password..' });
        return res.status(400).render('user/login', { errors });
    }

    const token = await jwt.sign(
        { id: user.user_id },
        process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
    res.cookie('jwt', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect('/user/dashboard');
};


// 1.2 Register
// ADMIN REGISTER ==> To be commented
exports.getRegister = (req, res, next) => {
    res.render('User/register');
};

exports.postRegister = async (req, res, next) => {
    const { fname, username, mobile, email, password, confirmPassword } = req.body;
    let errors = [];

    if (password !== confirmPassword) {
        errors.push({ msg: 'Passwords do not match' })
        return res.render('User/register', { errors });
    } else {

        let user = await userModel.findOne({
            email: email
        });

        if (user) {
            errors.push({ msg: 'email is already registred' })
            return res.render('User/register', { errors });
        }

        user = await userModel.findOne({
            username: username
        });

        if (user) {
            errors.push({ msg: 'username is already registred' })
            return res.render('User/register', { errors });
        }

        let bcrypted_password = await bcrypt.hash(password, 10);

        let register = await userModel.create({
            user_id: uuidv4(),
            fname: fname,
            username: username,
            mobile: mobile,
            email: email,
            password: bcrypted_password,
        })

        req.flash('success_msg', 'You are now registered and can log in');
        return res.redirect('/user/login');

    }
};

exports.getProfile = async (req, res, next) => {

    let video = await videoModel.find({}).limit(10).
        sort({ createdAt: 1 });

    for (let i = 0; i < video.length; i++) {

        let author = await adminModel.findOne({ admin_id: video[i].userId });

        video[i]['author'] = author.username
    }

    let audio = await audioModel.find({ visibility: "Public" }).limit(10).
        sort({ createdAt: -1 });

    for (let i = 0; i < audio.length; i++) {

        let author = await adminModel.findOne({ admin_id: audio[i].userId });
        console.log("author", author)
        audio[i]['author'] = author.username
    }

    let doc = await documentModel.find({ visibility: "Public" }).limit(10).
        sort({ createdAt: -1 });

    for (let i = 0; i < doc.length; i++) {

        let author = await adminModel.findOne({ admin_id: doc[i].userId });
        console.log("author", author)
        doc[i]['author'] = author.username
    }

    res.render('User/profile', {
        videos: video,
        audios: audio,
        documents: doc,
        page_name: 'Dashboard',
    });
};

exports.getLogout = (req, res, next) => {
    console.log("logout")
    res.cookie('jwt', '', { maxAge: 1 });
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
};

// 2 Get Video

exports.getVideo = async (req, res, next) => {

    let id = req.query.id;
    let video = await videoModel.findOne({ id, visibility: "Public" });

    let author = await adminModel.findOne({ admin_id: video.userId });

    if (author) {
        video['author'] = author.username
    }


    let recommendedVideos = await videoModel.find({ category: video.category, visibility: "Public" });

    if (recommendedVideos.length) {
        for (let i = 0; i < recommendedVideos.length; i++) {

        }
    }

    let ratings = await ratingModel.find({ userId: req.user, mediaId: video.id });
    let sum = 0
    let averageRating = 0

    if (ratings.length) {
        for (let obj of ratings) {
            sum += obj.rating
        }

        averageRating = sum / ratings.length;

    }
    res.render('User/Video/video', {
        averageRating,
        video,
        userId: req.user,
        recommendedVideos,
        page_name: 'Dashboard',
    });
}

exports.getAudio = async (req, res, next) => {

    let id = req.query.id;
    let audio = await audioModel.findOne({ id, visibility: "Public" });

    let author = await adminModel.findOne({ admin_id: audio.userId });

    if (author) {
        audio['author'] = author.username
    }


    let recommendedAudio = await audioModel.find({ category: audio.category, visibility: "Public" });

    let ratings = await ratingModel.find({ userId: req.user, mediaId: audio.id });
    let sum = 0
    let averageRating = 0

    if (ratings.length) {
        for (let obj of ratings) {
            sum += obj.rating
        }

        averageRating = sum / ratings.length;

    }

    res.render('User/Audio/audio', {
        averageRating,
        userId: req.user,
        audio,
        recommendedAudio,
        page_name: 'Dashboard',
    });
}

exports.getVideoByCategory = async (req, res, next) => {

    let video = await videoModel.find({}).
        sort({ createdAt: 1 });
    let categories = {}

    for (let i = 0; i < video.length; i++) {
        let author = await adminModel.findOne({ admin_id: video[i].userId });
        let category = video[i].category
        video[i]['author'] = author.username;

        if (categories[category]) {
            categories[`${category}`].videos.push(video[i])
        } else {
            categories[`${category}`] = { videos: [] }
            categories[`${category}`].videos.push(video[i])
        }
    }

    res.render('User/video_category', {
        categories: categories,
        videos: video,
        page_name: 'video',
    });
};

exports.getAudioByCategory = async (req, res, next) => {

    let audio = await audioModel.find({}).
        sort({ createdAt: 1 });
    let categories = {}

    for (let i = 0; i < audio.length; i++) {
        let author = await adminModel.findOne({ admin_id: audio[i].userId });
        let category = audio[i].category
        audio[i]['author'] = author.username;

        if (categories[category]) {
            categories[`${category}`].audios.push(audio[i])
        } else {
            categories[`${category}`] = { audios: [] }
            categories[`${category}`].audios.push(audio[i])
        }
    }

    res.render('User/audio_category', {
        categories: categories,
        audios: audio,
        page_name: 'audio',
    });
};

exports.getDocByCategory = async (req, res, next) => {

    let document = await documentModel.find({}).
        sort({ createdAt: 1 });
    let categories = {}

    for (let i = 0; i < document.length; i++) {
        let author = await adminModel.findOne({ admin_id: document[i].userId });
        let category = document[i].category
        document[i]['author'] = author.username;

        if (categories[category]) {
            categories[`${category}`].documents.push(document[i])
        } else {
            categories[`${category}`] = { documents: [] }
            categories[`${category}`].documents.push(document[i])
        }
    }

    res.render('User/doc_category', {
        categories: categories,
        documents: document,
        page_name: 'document',
    });
};

exports.postRating = async (req, res, next) => {
    let query = req.query;
    let obj = {};

    obj['ratingId'] = uuidv4();
    obj['rating'] = query.rating;
    obj['userId'] = query.userId;
    obj['mediaId'] = query.videoId;

    console.log(obj, 'obj');

    let addRating = await ratingModel.updateOne({ ['userId']: obj.userId, ['mediaId']: obj.mediaId }, obj, { upsert: true });
    res.status(200).send({ message: 'Rating added', data: addRating });
};