const express = require("express");
const passport = require("passport");
const User = require("../models/User");
const router = express.Router();

router.get("/register", (req, res) => {
    res.render("register");
});

router.post("/register", async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const user = new User({ username, email });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            res.redirect("/");
        });
    } catch (e) {
        res.send("Error registering user");
    }
});

router.get("/login", (req, res) => {
    res.render("login");
});

router.post("/login",
    passport.authenticate("local", { failureRedirect: "/login" }),
    (req, res) => {
        res.redirect("/");
    }
);

router.get("/logout", (req, res) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect("/");
    });
});

module.exports = router;