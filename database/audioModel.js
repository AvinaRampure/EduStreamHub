const mongoose = require("mongoose")

const audioSchema = new mongoose.Schema({

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
    audioUrl:{
        type:String
    },
	imageUrl :{
        type:String
    },
	category :{
        type:String
    }
    
}, { timestamps: true })

module.exports = mongoose.model("audio", audioSchema)
//