var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

// root route
router.get("/", function(req, res){
    res.render("landing");
});

// ====================
// Auth routes
// ====================
//register
//show register form
router.get("/register", function(req, res){
    res.render("register");
});
//handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to Swatch Bharat App " + user.username);
            res.redirect("/places");
        });
    });
});

//login
//show login form
router.get("/login", function(req, res){
    res.render("login");
});
//handle sign up logic
router.post("/login", passport.authenticate("local", {
    successRedirect: "/places",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: "Successfully logged in."
}), function(req, res){});

//logout
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/places");
});

module.exports = router;