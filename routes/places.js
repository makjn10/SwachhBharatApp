var express = require("express");
var router = express.Router();
var Place = require("../models/place"),
    Comment = require("../models/comment");
var middleware = require("../middleware"),
    multer = require("multer"),
    path =  require("path"),
    {spawn} = require("child_process"),
    fs = require("fs"),
    request = require("request");


//multer configuration    
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
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var uploadDir = multer({ storage: storage, fileFilter: imageFilter});

//cloudinary configuration
var cloudinary = require('cloudinary');
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});



function runScript(pathToImage){
    return spawn('python', [
      "-u", 
      path.join(__dirname + "/../", 'script.py'),
      pathToImage, 
    ]);
}


//INDEX
router.get("/", function(req, res){
    //Get all places from DB
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
     var name = req.body.name;    
    var description = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    var address = {
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode
    };
    let garbageVal;
    var imgurl, imgId, position;
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
            cloudinary.uploader.upload(req.file.path, function(result) {
                // add cloudinary url for the image to the place object under image property
                imgurl = result.secure_url; 
                imgId = result.public_id;

                //making tomtom geocode API call
                var url = "https://api.tomtom.com/search/2/structuredGeocode.json?countryCode=IN&limit=10&streetName="+ encodeURI(address.street) + "&municipality=" + encodeURI(address.city) + "&countrySubdivision=" + encodeURI(address.state) + "&postalCode=" + encodeURI(address.pincode) + "&view=IN&key=" + process.env.TOMTOM_API_KEY;
                request(url, {json: true}, (err, response, body) => {
                    if (err) {
                        console.log(err);
                    }

                    var lat, lon;
                    if(body.results.length == 0){
                        lon = 0.0;
                        lat = 0.0;
                    }
                    else{
                        lon = body.results[0].position.lon;
                        lat = body.results[0].position.lat;
                    }
                    var position = {
                        lon: lon,
                        lat: lat
                    }
                    var newPlace = {name:name, image:imgurl, description:description, author:author, garbageVal:garbageVal, imageId: imgId, address: address, position:position};
                    //Create a new place and save to DB
                    Place.create(newPlace, function(err, newlyCreated){
                        if(err){
                            console.log("DB inserting error");
                            cloudinary.v2.uploader.destroy(place.imgId, (err) => {
                                if (err){
                                    console.log(err);
                                    req.flash("error", "Address or image error!! Not inserted Err2")
                                    res.send("back");
                                }
                                else{
                                    req.flash("error", "Address or image error!! Not inserted")
                                    res.send("back");
                                }
                            }); 
                        }
                        else{
                            fs.unlink("uploads/images/" + req.file.filename, (err) => {
                                if (err){
                                    console.log(err);
                                    return res.send("back");
                                }
                                res.send("/places/" + newlyCreated.id);
                            });
                        }
                    });
                });        
            }); 
        }
        else{
            req.flash("error", "No garbage found in the uploaded image.");
            fs.unlink("uploads/images/" + req.file.filename, (err) => {
                if (err){
                    console.log(err);
                    return res.send("back");
                }
                console.log("Image deleted from server");
                res.send("/places");
            });
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
            
            cloudinary.v2.uploader.destroy(place.imageId, (err) => {
                if (err){
                    console.log(err);
                    return res.redirect("back");
                }
                else{
                    place.remove(function(err){
                        if(err){
                            console.log(err);
                            req.flash("error", "Error occured while deleting!");
                            res.redirect("/places");
                        }
                        else{
                            req.flash('success', 'Place deleted successfully!');
                            res.redirect("/places");
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;