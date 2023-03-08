const express = require('express');
const app = express();
const port = 8080;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const UserModel = require('./models/Users');
const bcrypt = require('bcryptjs');
const sessions = require('client-sessions');
const cors = require('cors');
const jwt = require('jsonwebtoken');
//open dotenv file
require('dotenv').config();
//get the environment variable for the database connection string
const db = process.env.MONGODB_URI;

// middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({origin: 'https://plankton-app-dmrtd.ondigitalocean.app'}));
app.use(sessions({
    cookieName: 'session',
    secret: 'blablablalbslbnfsvjnsdfljkdsfjld9238430497t4.jef34',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    httpOnly: true
}));
app.use((req, res, next) => {
    if (!(req.session && req.session.userId)) {
        return next();
    }
    UserModel.findById(req.session.userId)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            res.locals.user = user;
            next();
        })
        .catch(err => {
            next(err);
        });
});

function loginRequired(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized user!' });
    }
    return next();
}

//connect to the database
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })

app.post('/register', (req, res) => {
    let hash = bcrypt.hashSync(req.body.password, 14);
    const newUser = new UserModel({
        email: req.body.email,
        password: hash,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    });
    newUser.save()
        .then(user => res.json(user))
        .catch(err => res.json({status: 'error', message: err}));
});

app.post('/login', (req, res) => {
    UserModel.find({ email: req.body.email })
        .then(user => {
            if (user.length === 0) {
                return res.status(404).json({ email: 'User not found' });
            }
            if (bcrypt.compareSync(req.body.password, user[0].password)) {
                req.session.userId = user[0]._id;
                //const token = jwt.sign({ id: user[0]._id }, process.env.JWT_SECRET, { expiresIn: 86400 });
                return res.send({ token: "token123"});
            }
            return res.status(400).json({ password: 'Incorrect password' });
        }
)});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});