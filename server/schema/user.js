"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a User
 */
/* jshint node: true */

var mongoose = require('mongoose');
const LOGINTYPE=['LOGIN','LOGOUT','NEWCOMMENT','NEWPHOTO'];
var messageSchema=new mongoose.Schema({
    user_id:mongoose.Schema.Types.ObjectId,
    type:String,
    date_time:{type: Date, default: Date.now},
    read:Boolean,
    ref_primary:mongoose.Schema.Types.ObjectId,
    ref_secondary:mongoose.Schema.Types.ObjectId,
})
var activitySchema=new mongoose.Schema({
    type:{type:String,enum:LOGINTYPE,required:true},
    date_time:{type:Date,required:true},
})
// create a schema
var userSchema = new mongoose.Schema({
    first_name: String, // First name of the user.
    last_name: String,  // Last name of the user.
    location: String,    // Location  of the user.
    description: String,  // A brief user description
    occupation: String,    // Occupation of the user.
    login_name: String,
    hash: String,
    salt: String,
    favorite_list:[mongoose.Schema.Types.ObjectId],
    message_list:[messageSchema],
    register_time:{type:Date,default: Date.now},
    activity_history:[activitySchema],

});


// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;
