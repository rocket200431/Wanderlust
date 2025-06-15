const { listingSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');

module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(',');
    throw new ExpressError(400, msg);
  } else {
    next();
  }
};

// Example middleware function
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash && req.flash('error', 'You must be signed in first!');
    return res.redirect('/login');
  }
  next();
};