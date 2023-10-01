const mongoose = require("mongoose")

const documentSchema = new mongoose.Schema({

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
    docUrl:{
        type:String
    },
	imageUrl :{
        type:String
    },
	category :{
        type:String
    }
}, { timestamps: true })

module.exports = mongoose.model("document", documentSchema)
