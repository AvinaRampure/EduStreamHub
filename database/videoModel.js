const mongoose = require("mongoose")

const videoSchema = new mongoose.Schema({
    id : {
        type:String,
        unique:true
    },
	name :{
        type:String,
        unique:false
    },
    description :{
        type:String,
        unique:false
    },
    videoUrl:{
        type:String,
        unique:false
    },
	imageUrl :{
        type:String,
        unique:false
    },
	category :{
        type:String,
        unique:false
    },
    visibility : {
        type : String,
        unique:false
    },
    userId :{
        type : String,
        unique : false
    }
    
}, { timestamps: true })

module.exports = mongoose.model("video", videoSchema)
//