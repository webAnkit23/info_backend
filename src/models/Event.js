
const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
    name : {
        type :String,
        required : true
    },
    description : {
        type :String,
        required : true
    },
    minPlayer : {
        type : Number,
        required : true,
        min : 1
    },
    maxPlayer : {
        type : Number,
        required :true,
        min : 1
    },
    registrationOpen : {
        type : Boolean,
        default : true
    },
});
module.exports  = mongoose.model("Event", EventSchema);