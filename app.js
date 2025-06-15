const mongoose = require("mongoose");
require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");
const User = require("./models/User");
const Listing = require("./models/listing.js");

// Constants
const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 8080;

// Database Connection
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB Atlas");
    
    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected to DB");
    });
    
    mongoose.connection.on("error", (err) => {
      console.error("Mongoose connection error:", err);
    });
    
    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose disconnected");
    });
    
    return mongoose.connection;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

// View Engine Setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Session Configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production"
  }

};

app.set("trust proxy", 1);

app.use(session(sessionConfig));
app.use(flash());

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global Variables Middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.title = "Wanderlust";
  next();
});

// Routes
app.get("/", (req, res) => {
  res.render("home");
});

// Auth Routes
app.get("/register", (req, res) => {
  res.render("users/register");
});

app.post("/register", wrapAsync(async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password);
    
    req.login(registeredUser, err => {
      if (err) return next(err);
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/register");
  }
}));

app.get("/login", (req, res) => {
  res.render("users/login");
});

app.post("/login", passport.authenticate("local", {
  failureFlash: true,
  failureRedirect: "/login"
}), (req, res) => {
  req.flash("success", `Welcome back, ${req.user.username}!`);
  const redirectUrl = req.session.returnTo || "/listings";
  delete req.session.returnTo;
  res.redirect(redirectUrl);
});

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Successfully logged out");
    res.redirect("/");
  });
});

// Listing Routes
const listingRoutes = require("./routes/listings.js");
app.use("/listings", listingRoutes);

// 404 Handler
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Global Error Handler
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  
  console.error(`Error ${statusCode}: ${message}`);
  console.error(err.stack);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(val => val.message);
    req.flash("error", messages.join(", "));
    return res.redirect("back");
  }

  if (err.name === "CastError") {
    req.flash("error", "Invalid ID format");
    return res.redirect("back");
  }

  res.status(statusCode).render("error", { err });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log("Shutting down gracefully...");
      server.close(async () => {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();