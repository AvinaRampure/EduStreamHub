const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
	id :{ 
        type:String,
        unique:true
    },
	cname :{
        type:String
    }
}, { timestamps: true })

module.exports = mongoose.model("category", categorySchema)
//