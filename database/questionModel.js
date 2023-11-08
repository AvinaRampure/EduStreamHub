const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema({

    question_id: {
        type: String
    },
    answer: {
        type: String
    },
    userId: {
        type: String
    }

}, { timestamps: true })

module.exports = mongoose.model("question", questionSchema)
//