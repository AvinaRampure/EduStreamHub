const mongoose = require("mongoose")

const adminSchema = new mongoose.Schema({

	admin_id :{ 
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

module.exports = mongoose.model("admin", adminSchema)
//