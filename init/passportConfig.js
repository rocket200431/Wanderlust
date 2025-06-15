const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("../models/User");

module.exports = function (app) {
    app.use(require("express-session")({
        secret: "notagoodsecret",
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
};