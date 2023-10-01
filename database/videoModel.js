const mongoose = require("mongoose")

const videoSchema = new mongoose.Schema({

	id :{ 
        type:String,
        unique:true
    },
	name :{
        type:String
    },
    description :{
        type:String
    },
    videoUrl:{
        type:String
    },
	imageUrl :{
        type:String
    },
	category :{
        type:String
    }
    
}, { timestamps: true })

module.exports = mongoose.model("video", videoSchema)
//