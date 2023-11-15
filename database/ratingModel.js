const mongoose = require("mongoose")

const ratingSchema = new mongoose.Schema({

    ratingId: {
        type: String
    },
    userId: {
        type: String
    },
    mediaId: {
        type: String
    },
    rating : {
        type : Number
    }

}, { timestamps: true })

module.exports = mongoose.model("rating", ratingSchema)
//