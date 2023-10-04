const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({

	user_id :{ 
        type:String,
        unique:true
    },
	fname :{
        type:String
    },
    username :{
        type:String
    },
    mobile:{
        type:Number
    },
	email :{
        type:String
    },
	password :{
        type:String
    }
    
}, { timestamps: true })

module.exports = mongoose.model("user", userSchema)
//