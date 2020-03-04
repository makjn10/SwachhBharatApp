var express = require("express");
var router = express.Router({mergeParams : true});
var Place = require("../models/place");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//comments new
router.get("/new", middleware.isLoggedIn, function(req, res){
    Place.findById(req.params.id, function(err, foundPlace){
        if(err || !foundPlace){
            req.flash("error", "Place not found");
            res.redirect("back");
        }
        else{
            res.render("comments/new", {place: foundPlace});
        }
    });
});
//comments create
router.post("/", middleware.isLoggedIn, function(req, res){
    //lookup
    //create
    //associate
    //redirect
    Place.findById(req.params.id, function(err, place){
        if(err){
            console.log(err);
            res.redirect("/places");
        }
        else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.log(err);
                    req.flash("error", "Something went wrong");
                    res.redirect("/places");
                }
                else{
                    //add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    //save the comment
                    comment.save()
                    //add comment to campground
                    place.comments.push(comment);
                    place.save(function(err, data){
                        if(err){
                            console.log(err);
                            res.redirect("/places");
                        }
                        else{
                            req.flash("success", "Successfully added comment");
                            res.redirect("/places/" + place._id);
                        }
                    });
                }
            });
        }
    });
});

//EDIT
//shows edit form
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err || !foundComment){
            req.flash("error", "Comment not found");
            res.redirect("back");
        }
        else{
            res.render("comments/edit", {comment: foundComment, place_id: req.params.id});
        }
    });
});
//UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            console.log("err");
            res.redirect("back");
        }
        else{
            res.redirect("/places/" + req.params.id);
        }
    });
});

//DESTROY
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            console.log(err);
            res.redirect("back");
        }
        else{
            Place.findByIdAndUpdate(req.params.id, {
                $pull: {
                    comments: req.params.comment_id
                    //it removes all instances of this id value in comments array of the campground
                }
            }, function(err, updatedplace){
                if(err){
                    console.log(err);
                    res.redirect("back");
                }
                else{
                    req.flash("success", "Comment deleted");
                    res.redirect("/places/" + req.params.id);
                }
            });    
        }
    });
});

module.exports = router;