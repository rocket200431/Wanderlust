const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");

// Register Form
router.get("/register", (req, res) => {
  res.render("users/register");
});

// Register User
router.post("/register", wrapAsync(async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, err => {
      if (err) return next(err);
      req.flash("success", "Welcome!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/register");
  }
}));

// Login Form
router.get("/login", (req, res) => {
  res.render("users/login");
});

// Login User
router.post("/login", passport.authenticate("local", {
  failureFlash: true,
  failureRedirect: "/login"
}), (req, res) => {
  req.flash("success", "Welcome back!");
  const redirectUrl = req.session.returnTo || "/listings";
  delete req.session.returnTo;
  res.redirect(redirectUrl);
});

// Logout User
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "Goodbye!");
  res.redirect("/");
});

module.exports = router;