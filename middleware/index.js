
var Place = require("../models/place"),
    Comment = require("../models/comment");

//all the middlewares
var middlewareObj = {};
middlewareObj.checkPlaceOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Place.findById(req.params.id, function(err, foundPlace){
            if(err || !foundPlace){
                req.flash("error", "Place not found");
                res.redirect("back");
            }
            else{
                if(foundPlace.author.id.equals(req.user._id)){
                    next();
                }
                else{
                    req.flash("error", "You are not authorized to that");
                    res.redirect("back");
                }  
            }
        });
    }
    else{
        req.flash("error", "You need to be logged in to that.");
        res.redirect("back");//redirects to backpage
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Place.findById(req.params.id, function(err, foundPlace){
            if(err || !foundPlace){
                req.flash("error", "Place not found");
                return res.redirect("back");
            }
            Comment.findById(req.params.comment_id, function(err, foundComment){
                if(err || !foundComment){
                    req.flash("error", "Comment not found");
                    res.redirect("back");
                }
                else{
                    if(foundComment.author.id.equals(req.user._id)){
                        next();
                    }
                    else{
                        req.flash("error", "You are not authorized to that");
                        res.redirect("back");
                    }  
                }
            });
        });
    }
    else{
        req.flash("error", "You need to be logged in to that.");
        res.redirect("back");//redirects to backpage
    }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to that.");
    res.redirect("/login");
}

module.exports = middlewareObj;