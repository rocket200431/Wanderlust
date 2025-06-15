const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Listing = require('../models/listing');
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn, validateListing } = require('../middleware');

// Show New Listing Form
router.get('/new', isLoggedIn, (req, res) => {
  res.render('listings/new');
});

// Create Listing - handle form POST
router.post('/', isLoggedIn, wrapAsync(async (req, res) => {
  const listingData = req.body.listing;
  // Optionally, associate the listing with the logged-in user
  listingData.author = req.user._id;
  const listing = new Listing(listingData);
  await listing.save();
  req.flash('success', 'Listing created successfully!');
  res.redirect(`/listings/${listing._id}`);
}));

// Index Route - Show all listings
router.get('/', wrapAsync(async (req, res) => {
  const listings = await Listing.find({});
  res.render('listings/index', { listings });
}));

// Show Route - View a single listing
router.get('/:id', wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Check if ID is valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash('error', 'Invalid listing ID');
    return res.redirect('/listings');
  }

  const listing = await Listing.findById(id).populate('author');
  if (!listing) {
    req.flash('error', 'Listing not found');
    return res.redirect('/listings');
  }
  
  res.render('listings/show', { listing });
}));

// Edit Form Route - Show edit form
router.get('/:id/edit', 
  isLoggedIn,
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'Invalid listing ID');
      return res.redirect('/listings');
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash('error', 'Listing not found');
      return res.redirect('/listings');
    }
    
    res.render('listings/edit', { listing });
}));

// Update Route - Process the edit form
router.put('/:id', 
  isLoggedIn,
  validateListing,
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'Invalid listing ID');
      return res.redirect('/listings');
    }

    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if (!listing) {
      req.flash('error', 'Listing not found');
      return res.redirect('/listings');
    }
    
    req.flash('success', 'Successfully updated listing!');
    res.redirect(`/listings/${id}`);
}));

// Delete Listing
router.delete('/:id', isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash('success', 'Listing deleted successfully!');
  res.redirect('/listings');
}));

module.exports = router;