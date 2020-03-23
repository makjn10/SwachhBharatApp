require('dotenv').config()

var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    flash = require("connect-flash"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    User = require("./models/user"),
    methodOverride = require("method-override");

//requiring routes
var commentRoutes = require("./routes/comments"),
    placeRoutes = require("./routes/places"),
    indexRoutes = require("./routes/index");

var DBuri =  process.env.DATABASEURL;
mongoose.connect(DBuri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(res=>{
    console.log("DB Connected!")
}).catch(err => {
    console.log(Error, err.message);
});

app.use(methodOverride("_method"));
app.use(flash());

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: process.env.EXPSESSIONSEC,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//passing user to every route
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
app.use("/", indexRoutes);
app.use("/places/:id/comments", commentRoutes);
app.use("/places", placeRoutes);


var PORT = process.env.PORT;
app.listen(PORT, function(){
    console.log("Swachh Bharat server has started!");
});