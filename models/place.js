var mongoose = require("mongoose");
//data
//SCHEMA SETUP
var placeSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    garbageVal: String
});


module.exports = mongoose.model("Place", placeSchema);