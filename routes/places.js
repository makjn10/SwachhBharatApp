var express = require("express");
var router = express.Router();
var Place = require("../models/place"),
    Comment = require("../models/comment");
var middleware = require("../middleware"),
    multer = require("multer"),
    path =  require("path"),
    {spawn} = require("child_process");

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/../uploads/images')
    },
    filename: function (req, file, cb) {
        let extArray = file.mimetype.split("/");
        let extension = extArray[extArray.length - 1];
        cb(null, file.fieldname + '-' + Date.now()+ '.' +extension)
    }
});
var uploadDir = multer({storage: storage});

function runScript(pathToImage){
    return spawn('python', [
      "-u", 
      path.join(__dirname + "/../", 'script.py'),
      pathToImage, 
    ]);
}

//INDEX
router.get("/", function(req, res){
    //Get all campgrounds from DB
    Place.find({}, function(err, allplaces){
        if(err){
            console.log("DB retrieval error");
        }
        else{
            res.render("places/index", {places: allplaces});
        }
    });   
});

//CREATE
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("places/new");
});

router.post("/", middleware.isLoggedIn, uploadDir.single("image"), function(req, res){
    //get data from form and add to campgrounds array
    //redirect to campgrounds page
    var name = req.body.name;
    var imgurl = "/uploads/images/" + req.file.filename;
    var description = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    let garbageVal;
    // to run python script
    //pass imgurl
    //get image dirty tag
    const subprocess = runScript("uploads/images/" + req.file.filename);
    // print output of script
    subprocess.stdout.on('data', (data) => {
        garbageVal = data.toString();
    });
    subprocess.on('close', () => {
        console.log("uploads/images/" + req.file.filename, ": ", garbageVal);
        if(garbageVal === "Garbage found\n"){
            var newPlace = {name:name, image:imgurl, description:description, author:author, garbageVal:garbageVal};
            //Create a new campground and save to DB
            Place.create(newPlace, function(err, newlyCreated){
                if(err){
                    console.log("DB inserting error");
                }
                else{
                    res.redirect("/places");
                }
            });
        }
        else{
            req.flash("error", "No garbage found in the uploaded image.");
            res.redirect("/places");
        }         
    });       
});

//SHOW
router.get("/:id", function(req, res){
    //FIND OUT THE ID AND THE CORRESPONDING PAGE IS RENDERED
    Place.findById(req.params.id).populate("comments").exec(function(err, foundPlace){
        if(err || !foundPlace){
            req.flash("error", "Place not found.")
            res.redirect("/places");
        }
        else{
            res.render("places/show", {place: foundPlace});
        }
    });
});

//EDIT
router.get("/:id/edit", middleware.checkPlaceOwnership, function(req, res){
    Place.findById(req.params.id, function(err, foundPlace){
        res.render("places/edit", {place: foundPlace});
    });
});

//UPDATE
router.put("/:id", middleware.checkPlaceOwnership, function(req, res){
    //find and update
    Place.findByIdAndUpdate(req.params.id, req.body.place, function(err, updatedPlace){
        if(err){
            console.log(err);
            res.redirect("/places");
        }
        else{
            res.redirect("/places/" + req.params.id);
        }
    });
});

//DESTROY
router.delete("/:id", middleware.checkPlaceOwnership, function(req, res){
    Place.findById(req.params.id, function(err, place){
        if(err){
            console.log(err);
            res.redirect("/places");
        }
        else{
            var COMMENTSid = place.comments;
            COMMENTSid.forEach(function(commentid){
                Comment.findByIdAndRemove(commentid, function(err){
                    if(err){
                        console.log(err);
                        return res.redirect("/places");
                    }
                });
            });
            place.remove(function(err){
                if(err){
                    console.log(err);
                    res.redirect("/places");
                }
                else{
                    res.redirect("/places");
                }
            });
        }
    });
});

module.exports = router;