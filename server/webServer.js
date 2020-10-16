"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var MemoryStore = require('memorystore')(session)


//var processFormBody = multer({ storage: multer.memoryStorage() }).single('uploadedphoto');
var processFormBody = multer({ storage: multer.memoryStorage() }).single('uploadedphoto');

mongoose.Promise = require('bluebird');

var async = require('async');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');

var SchemaInfo = require('./schema/schemaInfo.js');
var fs = require("fs");

var express = require('express');
const { json } = require('express');
var app = express();

var cookie = require('cookie');
var cookieParser = require('cookie-parser');


// XXX - Your submission should work without this line. Comment out or delete this line for tests and before submission!
//var cs142models = require('./modelData/photoApp.js').cs142models;
var cs142password = require('./cs142password');


var subscriptorsList = {};

var mentionReg = /<<\(\{\{(\w+)\?\?(\w+)\}\}\)>>/g;

mongoose.connect('mongodb://localhost/cs142project6', { useNewUrlParser: true, useUnifiedTopology: true });

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.

var sessionStore = new MemoryStore({ checkPeriod: 86400000 })
app.use(session({ secret: 'secretKey', store: sessionStore, resave: false, saveUninitialized: false }));
app.use(bodyParser.json());
app.use(express.static('public'))
app.set('port', 3000);


app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            { name: 'user', collection: User },
            { name: 'photo', collection: Photo },
            { name: 'schemaInfo', collection: SchemaInfo }
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.countDocuments({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    User.find({}, { _id: 1, first_name: 1, last_name: 1, login_name: 1, register_time: 1, activity_history: 1 }).then((data) => {
        if (data.length === 0) {
            response.status(404).send("Not Found");
        } else {
            data = data.map(user => {
                user = user.toObject();
                if (user.activity_history.length === 0) {
                    user.new_activity = { type: "NEWUSER", user_id: user._id, date_time: user.register_time, _id: Date.now() };
                } else {
                    user.new_activity = user.activity_history[user.activity_history.length - 1];
                    //user.new_activity=user.new_activity.toObject();
                    user.new_activity.user_id = user._id;
                }
                delete user.activity_history;
                return user;
            })
            let json = JSON.stringify(data);
            response.status(200).send(json);
        }
    })

});

/*
 * URL /user/:id - Return the information for User (id)
 */
///////
app.get('/user/:id', function (request, response) {
    let id = request.params.id;
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        response.status(400).send("Unauthorized");
        return;
    }
    //var id = request.params.id;
    User.findOne({ _id: id }, {
        _id: 1, first_name: 1, last_name: 1,
        description: 1, occupation: 1, location: 1,
    }).then((data) => {
        if (data) {
            let newData = data.toObject();
            if (data._id !== request.session.user_id) {
                delete newData.favorite_list;
            }

            Photo.find({ user_id: id }).then(photos => {
                if (photos.length === 0) {
                    newData.newPhoto = {};
                    newData.poPhoto = {};
                    let json = JSON.stringify(newData);
                    response.status(200).send(json);
                } else {
                    photos = photos.filter(photo => visibilityCheck(photo, request.session.user_id));
                    newData.newPhoto = photos.sort((e1, e2) => {
                        if (e1.date_time < e2.date_time) {
                            return -1;
                        } else if (e1.date_time === e2.date_time) {
                            return 0;
                        } else {
                            return 1;
                        }
                    })[photos.length - 1]
                    newData.poPhoto = photos.sort((e1, e2) => {
                        let len1 = e1.comments ? e1.comments.length : 0;
                        let len2 = e2.comments ? e2.comments.length : 0;
                        return len1 - len2;
                    })[photos.length - 1]
                    let json = JSON.stringify(newData);
                    response.status(200).send(json);

                }
            })
        } else {

            response.status(404).send("Not Found");
        }
    })

});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    let id = request.params.id;
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        response.status(400).send("Unauthorized");
        return;
    }
    let photos = [];
    Photo.find({ user_id: id }, { _id: 1, file_name: 1, date_time: 1, user_id: 1, comments: 1, visibility_list: 1, like_list: 1,tag_list:1 }).then((data) => {
        if (data.length === 0) {
            response.status(404).send("Not Found");
        } else {
            data = data.filter(photo => visibilityCheck(photo, request.session.user_id));
            async.each(data, modifyComments, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    response.status(200).send(JSON.stringify(photos));

                }
            })

        }
    })
    async function modifyComments(photo, callback) {
        let newPhoto = photo.toObject();
        delete newPhoto.visibility_list;
        newPhoto.comments = []
        if (photo.comments.length === 0) {

        } else {
            for (let comment of photo.comments) {
                let user = await User.findOne({ _id: comment.user_id }, { _id: 1, first_name: 1, last_name: 1 });
                if (!user) {
                    callback(new Error("Something Wrong"));
                    break;
                }
                let newComment = comment.toObject();
                newComment.user = {}
                newComment.user._id = comment.user_id;
                newComment.user.first_name = user.first_name;
                newComment.user.last_name = user.last_name;

                newPhoto.comments.push(newComment)

            }
        }
        photos.push(newPhoto)

    }


});
app.post('/admin/login', function (request, response) {
    let login_name = request.body.login_name;
    User.findOneAndUpdate({ login_name: login_name }, { $push: { activity_history: { type: "LOGGIN", date_time: Date.now() } } }, { new: true })
        .then((data) => {
            if (data) {

                if (cs142password.doesPasswordMatch(data.hash, data.salt, request.body.password)) {
                    request.session.user_id = data._id;
                    let newData = {
                        _id: data._id, first_name: data.first_name,
                        last_name: data.last_name, location: data.location,
                        description: data.description, occupation: data.occupation,
                        favorite_list: data.favorite_list,
                        message_list: data.message_list
                    };
                    response.status(200).send(JSON.stringify(newData));
                    for (let id of Object.keys(subscriptorsList)) {
                        let temActivity = data.activity_history[data.activity_history.length - 1];
                        subscriptorsList[id].emit("LogIn", JSON.stringify({ _id: temActivity._Id, user_id: request.session.user_id, date_time: temActivity.date_time }));

                    }
                } else {
                    //console.log("Wrong");
                    throw (new Error("Wrong Paasword"))
                }
            }
            else {
                throw (new Error("No Account"))
            }


        }).catch(e => { response.status(400).send(e.toString()); })
});


app.post('/admin/logout', function (request, response) {
    User.findOneAndUpdate({ _id: request.session.user_id }, { $push: { activity_history: { type: 'LOGOUT', date_time: Date.now() } } }, { new: true }).then(data => {
        if (subscriptorsList[data._id]) {
            subscriptorsList[data._id].disconnect(true);
            delete subscriptorsList[data._id];
            console.log("CLose Connection", Object.keys(subscriptorsList).length);
        }
        for (let id of Object.keys(subscriptorsList)) {
            let temActivity = data.activity_history[data.activity_history.length - 1];
            subscriptorsList[id].emit("LogOut", JSON.stringify({ _id: temActivity._id, user_id: data._id, date_time: temActivity.date_time }));

        }

    }).catch(e => console.log(e));
    request.session.destroy();
    response.status(200).send("Logout successfully");
});
// Add comment to a photo
app.post('/commentsOfPhoto/:photo_id', function (request, response) {
    let photo_id = request.params.photo_id;
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
        response.status(400).send("Bad Request, Invalid photo_id");
        return;
    }
    let user_id = request.session.user_id;
    let date = Date.now();
    User.findById(user_id).then(user => {

        Photo.findByIdAndUpdate(photo_id, {
            $push: {
                comments: {
                    comment: request.body.comment !== undefined ? request.body.comment : "",
                    date_time: date,
                    user_id: user_id,
                }

            }
        }, { new: true })
            .then((obj) => {
                let newComment = obj.comments[obj.comments.length - 1].toObject();
                newComment.user = { _id: user._id, first_name: user.first_name, last_name: user.last_name }
                response.status(200).send({ comment: newComment });
                User.findOneAndUpdate({ _id: request.session.user_id }, {
                    $push: {
                        activity_history: {
                            type: "NEWCOMMENT",
                            date_time: Date.now()
                        }
                    }
                }, { new: true }).then(data => {
                    for (let id of Object.keys(subscriptorsList)) {
                        let temActivity = data.activity_history[data.activity_history.length - 1];
                        subscriptorsList[id].emit("NewComment", JSON.stringify({ _id: temActivity._id, user_id: data._id, date_time: temActivity.date_time }));
                    }

                }).catch(e => console.log(e))
                let matches = [...newComment.comment.matchAll(mentionReg)];
                for (let match of matches) {
                    if (mongoose.Types.ObjectId.isValid(match[2])) {
                        //console.log()
                        User.findByIdAndUpdate(match[2], {
                            $push: {
                                message_list: {
                                    user_id: user_id,
                                    type: "MENTION",
                                    date_time: newComment.date_time,
                                    read: false,
                                    ref_primary: obj._id,
                                    ref_secondary: newComment._id,


                                }
                            }
                        }, { new: true }).then(res => {
                            if (subscriptorsList[match[2]]) {
                                console.log("Fired");
                                subscriptorsList[match[2]].emit("Message", JSON.stringify(res.message_list[res.message_list.length - 1]))
                            }
                        }).catch(e => console.log(e));
                    }
                }
            }).catch(e => { throw (e) })

    }).catch(e => { response.status(400).send(e.toString()) })
})
app.delete('/commentsOfPhoto/:photo_id/:comment_id', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    let photo_id = request.params.photo_id;
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
        response.status(400).send("Bad Request, Invalid photo_id");
        return;
    }
    let comment_id = request.params.comment_id;
    if (!mongoose.Types.ObjectId.isValid(comment_id)) {
        response.status(400).send("Bad Request, Invalid comment id");
        return;
    }
    Photo.find({ _id: photo_id }).then(data => {
        if (data.length !== 1) {
            throw (new Error("Invalid request or System Error"));
        }
        let comments = data[0].comments;
        comments = comments.filter(comment => comment._id.toString() === comment_id);
        if (comments.length === 0) {
            throw (new Error("InValid Comment"));
        } else if (comments.length > 1) {
            throw (new Error("System Wrong"));
        } else {
            if (comments[0].user_id.toString() !== request.session.user_id) {
                response.status(401).send("Unauthorized Operation");
                return;
            }
            Photo.update({ _id: photo_id }, { $pull: { comments: { _id: comment_id } } }).then(result => {
                if (result.n === 1 && result.nModified === 1 && result.ok === 1) {
                    response.status(200).send('uploaded');
                } else {

                    throw (new Error("Operation Failed"))
                }
            }).catch(e => { response.status(400).send(e.toString()) })
        }
    })


})
app.post('/photos/new', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            // XXX -  Insert error handling code here.
            console.log(err);
            return;
        }
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes

        // XXX - Do some validation here.
        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        //console.log(request.files["visibility"])

        var timestamp = new Date().valueOf();
        var filename = 'U' + String(timestamp) + request.file.originalname;
        //console.log(request.files)
        fs.writeFile("./public/images/" + filename, request.file.buffer, function (err) {
            // XXX - Once you have the file written into your images directory under the name
            // filename you can create the Photo object in the database
            if (err) {
                response.status(400).send("Bad Request, Error For Storing");
                //console.log("Error for Storing File");
            } else {
                Photo.create({
                    file_name: filename,
                    date_time: Date.now(),
                    user_id: request.session.user_id,
                    comments: [],
                    visibility_list: ["Me"],
                    like_list: [],
                    tag_list:[],
                }).then((obj) => {
                    response.status(200).send(JSON.stringify(obj));
                    User.findOneAndUpdate({ _id: request.session.user_id }, { $push: { activity_history: { type: "NEWPHOTO", date_time: Date.now() } } }, { new: true }).then(data => {
                        for (let id of Object.keys(subscriptorsList)) {
                            let temActivity = data.activity_history[data.activity_history.length - 1];
                            subscriptorsList[id].emit("NewPhoto", JSON.stringify({ _id: temActivity._id, user_id: data._id, date_time: temActivity.date_time }));
                        }
                    }).catch(e => console.log(e));

                }).catch((e) => {
                    console.log(e);
                    response.status(400).send("Bad Request");
                })
            }

        });
    });

})
app.delete('/photos/delete/:photo_id', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    let photo_id = request.params.photo_id;
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
        response.status(400).send("Bad Request");
        return;
    }
    Photo.find({ _id: photo_id }, { file_name: 1 }).then(data => {
        if (data.length !== 1) {
            response.status(400).send("Bad Request,No data Found or System Error");
            return;
        }
        let fileName = data[0].file_name;
        fs.unlink("./public/images/" + fileName, function (err) {
            if (err) {
                throw err;
            } else {
                Photo.deleteMany({ _id: photo_id }).then(result => {
                    if (result.n >= 1 && result.ok >= 1 && result.deletedCount >= 1) {
                        User.updateMany({}, { $pull: { favorite_list: photo_id } }).then(res => {
                            response.status(200).send("OK:" + res.ok + " N:" + res.n + " Modified:" + res.nModified);
                        }).catch(e => { throw (e) })

                    } else {
                        throw (new Error("Delete Failed"))
                    }
                }).catch(e => { throw (e) })
            }
        })

    }).catch((e => {
        response.status(400).send(e.toString());
    }))

})
// set visibility of a photo
app.post('/photos/control/:photo_id', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    let photo_id = request.params.photo_id;
    let user_id = request.session.user_id;
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
        response.status(400).send("Bad Request");
        return;
    }
    Photo.findById(photo_id).then(data => {
        if (!data) {
            throw (new Error("Bad Request"))
        } else {
            let photo = data;
            if (photo.user_id.toString() !== user_id) {
                throw (new Error("Unauthorized Operation"))
            }
            let newData;
            if (request.body.visibility_list.length === 1 && (request.body.visibility_list[0] === "All" || request.body.visibility_list[0] === "Me")) {
                newData = request.body.visibility_list;
            } else {
                newData = request.body.visibility_list.filter(user => mongoose.Types.ObjectId.isValid(user));
                newData = [...new Set(newData)];
            }
            if (newData.length === 0) {
                throw (new Error("Invalid List"))
            }
            Photo.findByIdAndUpdate(photo_id, { visibility_list: newData }).then(result => {
                if (result) {
                    Photo.findByIdAndUpdate(photo_id,{tag_list:request.body.tag_list}).then(obj=>{
                        if(obj){
                            response.status(200).send("Modified")
                        }else{
                            throw(new Error("Fail to Update Tag List"))
                        }
                    })
                    //response.status(200).send('uploaded');
                } else {
                    throw (new Error("Update failed"));
                }

            }).catch(e => { throw (e) });

        }
    }).catch(e=>response.status(400).send(e.toString()))

})
app.post('/user', function (request, response) {
    let login_name = request.body.login_name || "";
    let password = request.body.password || "";
    let first_name = request.body.first_name || "";
    let last_name = request.body.last_name || "";
    let location = request.body.location;
    let description = request.body.description;
    let occupation = request.body.occupation;
    let reg = /\S+/;
    let flag = (login_name.search(reg) !== -1);
    flag = flag && (password.search(reg) !== -1);
    flag = flag && (last_name.search(reg) !== -1);
    flag = flag && (first_name.search(reg) !== -1);
    if (!flag) {
        response.status(400).send("Bad Request, Key field can not be empty");
        return;
    }
    User.find({ login_name: login_name }).then((data) => {
        if (data.length !== 0) {
            response.status(400).send("Bad Request, login name already exists");
        } else {
            let pass = cs142password.makePasswordEntry(password);
            User.create({
                first_name: first_name,
                last_name: last_name,
                location: location,
                description: description,
                occupation: occupation,
                login_name: login_name,
                hash: pass.hash,
                salt: pass.salt,
                favorite_list: [],
                message_list: []
            }).then((userobj) => {
                request.session.user_id = userobj._id;
                let newData = {};
                newData.first_name = userobj.first_name;
                newData.last_name = userobj.last_name;
                newData.occupation = userobj.occupation;
                newData.login_name = userobj.login_name;
                newData.favorite_list = userobj.favorite_list;
                response.status(200).send(JSON.stringify(newData));
                for (let id of Object.keys(subscriptorsList)) {
                    if (id !== request.session.user_id) {
                        subscriptorsList[id].emit("NewUser", JSON.stringify({ user_id: request.session.user_id, date_time: Date.now() }));
                    }
                }
            }).catch((e) => {
                console.log("Bad Request, login name already exists");
                response.status(400).send("Bad Request, fail to register!");
            })
        }
    })

});
app.delete("/user", function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    User.deleteMany({ _id: request.session.user_id }).then(result => {
        if (result.ok >= 1) {
            Photo.find({ user_id: request.session.user_id }).then(data => {
                async.each(data, deletePhotoAndResource, function (err) {
                    if (err) {
                        throw (new Error("Failt to Delete Photo"))
                    }
                })
            }
            ).catch(e => { throw (e) });
            Photo.updateMany({},
                { $pull: { like_list: request.session.user_id } }).then(res => {
                    response.status(200).send("OK:" + res.ok + " N:" + res.n + " Modified:" + res.nModified);
                }).catch(e => { throw (e) });

        } else {
            throw (new Error("Opeartion Fail"))
        }
    }).catch(e => { response.status(400).send(e.toString()) })

})
function deletePhotoAndResource(photo, callback) {
    fs.unlink("./images/" + photo.file_name, function (err) {
        if (err && err.errno !== -2) {
            console.log(err);
            console.log("Fail to delete Photo Fille", photo.file_name);
            return;
        } else {
            Photo.deleteMany({ _id: photo._id }).then(result => {
                if (result.ok == 0) {
                    console.log("Fail to delete Photo in Database");
                    callback("Fail to delete Photo in Database")
                }
            })
        }

    })
}
app.get('/advanced/user/list', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    User.find({}, { first_name: 1, last_name: 1 }).then((data) => {
        if (data.length === 0) {
            response.status(404).send("Not Found");
        } else {
            let result = {};
            for (let user of data) {
                result[user._id] = { numPhotos: 0, numComments: 0 };
            }
            Photo.find({}).then((photos) => {
                photos = photos.filter(photo => visibilityCheck(photo, request.session.user_id))
                for (let photo of photos) {
                    if (result[photo.user_id]) {
                        result[photo.user_id].numPhotos += 1;
                    }
                    for (let comment of photo.comments) {
                        if (result[comment.user_id]) {
                            result[comment.user_id].numComments += 1;
                        }
                    }
                }
                let json = JSON.stringify(result);
                response.status(200).send(json);
            }).catch((e) => { response.status(400).send("Bad Request") })
        }
    })

})
app.get('/advanced/commentOfUser/:id', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    let id = request.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        response.status(400).send("Bad Request");
        return;
    }
    let result = {};
    User.find({ _id: id }, { first_name: 1, last_name: 1 }).then((data) => {
        if (data.length !== 1) {
            response.status(400).send("Bad Request");
        } else {
            result.first_name = data[0].first_name;
            result.last_name = data[0].last_name;
            result.comment = [];
            Photo.find({}).then((data) => {
                data = data.filter(photo => visibilityCheck(photo, request.session.user_id));
                for (let photo of data) {
                    if (!photo.comments || photo.comments.length === 0) {
                        continue;
                    }
                    for (let comment of photo.comments) {
                        if (comment.user_id == id) {
                            result.comment.push({
                                Photo: {
                                    _id: photo._id,
                                    file_name: photo.file_name,
                                    user_id: photo.user_id,
                                },

                                Comment: {
                                    _id: comment._id,
                                    date_time: comment.date_time,
                                    comment: comment.comment,
                                    user: { _id: comment.user_id, first_name: result.first_name, last_name: result.last_name }
                                }
                            })
                        }
                    }
                }
                let json = JSON.stringify(result);
                response.status(200).send(json);

            }).catch((e) => { response.status(400).send(e.toString()) })

        }
    })

})
app.post('/admin/test', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    } else {
        User.findById(request.session.user_id, {
            _id: 1, first_name: 1, last_name: 1,
            location: 1, description: 1, occupation: 1, favorite_list: 1, message_list: 1
        }).then(data => {
            if (data) {
                response.status(200).send(JSON.stringify(data))
                for (let id of Object.keys(subscriptorsList)) {
                    if (id !== request.session.user_id) {
                        subscriptorsList[id].emit("LogIn", JSON.stringify({ user_id: request.session.user_id, date_time: Date.now() }));
                    }
                }
            } else {
                throw (new Error("No Account"))
            }
        }).catch(e => { response.status(400).send(e.toString()) })
    }
})
app.post('/photo/like/:photo_id', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    let photo_id = request.params.photo_id;
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
        response.status(400).send("Bad Request");
        return;
    }
    Photo.update({ _id: photo_id }, {
        $addToSet: {
            like_list: request.session.user_id
        }
    }
    ).then(result => {
        if (result.n === 1 && result.ok === 1) {
            response.status(200).send('uploaded');
        } else {
            console.log(result.n === 1, result.nModified === 1, result.ok === 1)
            throw (new Error("Bad Request"))
        }

    }).catch(e => { response.status(400).send(e.toString()); })


})
app.delete('/photo/like/:photo_id', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    let photo_id = request.params.photo_id;
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
        response.status(400).send("Bad Request");
        return;
    }
    Photo.update({ _id: photo_id }, { $pull: { like_list: request.session.user_id } }).then(
        result => {
            if (result.n === 1 && result.nModified === 1 && result.ok === 1) {
                response.status(200).send('uploaded');
            } else {
                console.log(result.n === 1, result.nModified === 1, result.ok === 1)
                throw (new Error("Bad Request"))
            }

        }
    ).catch(e => { response.status(400).send(e.toString()); })

})

app.post('/user/favorite/:photo_id', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    let photo_id = request.params.photo_id;
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
        response.status(400).send("Bad Request, Invadid Photo Id");
        return;
    }
    Photo.find({ _id: photo_id }).then(data => {
        if (data.length === 0) {
            response.status(400).send("Bad Request, No data find");
            return;
        } else {
            User.update({ _id: request.session.user_id }, {
                $addToSet: {
                    favorite_list: photo_id
                }
            }
            ).then(result => {
                if (result.n === 1 && result.ok === 1) {
                    response.status(200).send('uploaded');
                } else {
                    console.log(result.n === 1, result.nModified === 1, result.ok === 1)
                    throw (new Error("Bad Request,Update Result Wrong"));
                }

            }).catch(e => { response.status(400).send(e.toString()); })


        }
    })

})
app.delete('/user/favorite/:photo_id', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    let photo_id = request.params.photo_id;
    if (!mongoose.Types.ObjectId.isValid(photo_id)) {
        response.status(400).send("Bad Request");
        return;
    }
    User.update({ _id: request.session.user_id }, {
        $pull: {
            favorite_list: photo_id
        }
    }
    ).then(result => {
        if (result.n === 1 && result.nModified === 1 && result.ok === 1) {
            response.status(200).send('uploaded');
        } else {
            console.log(result.n === 1, result.nModified === 1, result.ok === 1)
            throw (new Error("Bad Request"))
        }

    }).catch(e => { response.status(400).send(e.toString()); })

})
app.get('/favoritelist', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    let favList = [];
    User.findById(request.session.user_id, { favorite_list: 1 }).then((data) => {
        async.each(data.favorite_list, (photo_id, callback) => {
            Photo.findById(photo_id, { _id: 1, user_id: 1, file_name: 1, date_time: 1 }).then(data => { favList.push(data); console.log(favList); callback() }).catch(e => callback(e))
        }
            , function (err) {
                if (err) {
                    console.log("Error Occurs")
                    throw (new Error(err.toString()))
                } else {
                    //console.log("Sending", favList)
                    response.status(200).send(JSON.stringify(favList));
                }
            })
    }).catch(e => response.status(400).send(e.toString()));
})
app.get('/message', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    User.findById(request.session.user_id, { message_list: 1 }).then(data => {
        if (data) {
            let newData = { mentions: [] };
            async.each(data.message_list, (message, callback) => {
                if (message.type === "MENTION") {
                    Photo.findById(message.ref_primary, { id_: 1, file_name: 1, user_id: 1, date_time: 1, comments: 1 }).then(photo => {
                        if (photo) {
                            let targetComment = photo.comments.filter(comment => { return comment._id.toString() === message.ref_secondary.toString() });
                            if (targetComment.length >= 1) {
                                console.log("Found Comment", targetComment[0])
                                let col = {
                                    _id: message._id,
                                    Photo: {
                                        _id: photo._id,
                                        file_name: photo.file_name,
                                        user_id: photo.user_id,
                                        date_time: photo.date_time,
                                    },
                                    Comment: {
                                        _id: targetComment[0]._id,
                                        user_id: targetComment[0].user_id,
                                        comment: targetComment[0].comment,
                                        date_time: targetComment[0].date_time,

                                    }
                                }

                                newData.mentions.push(col);

                            } else {

                            }
                        } else {

                        }
                        callback();
                    })
                }
            }, (err) => {
                if (err) {
                    throw (new Error(err.toString()))
                } else {
                    //console.log("Data to be Send", newData);
                    response.status(200).send(JSON.stringify(newData));
                }
            })


        } else {
            if (subscriptorsList[request.session.user_id]) {
                subscriptorsList[request.session.user_id].disconnect(true);
                delete subscriptorsList[request.session.user_id];
                console.log("Close Connection", Object.keys(subscriptorsList).length);
            }
            request.session.destroy();
            throw (new Error("No Account"));
        }
    }).catch(e => response(400).send(e.toString()))

})
app.post('/readmessage/:message_id', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    let message_id = request.params.message_id;
    if (!mongoose.Types.ObjectId.isValid(message_id)) {
        response.status(400).send("InValid ID");
        return;
    }
    User.findById(request.session.user_id, { message_list: 1 }).then(data => {
        if (data) {
            let index = data.message_list.findIndex(message => message._id.toString() === message_id);
            if (index !== -1) {
                User.findOneAndUpdate({ "message_list._id": message_id }, { "$set": { "message_list.$.read": true } }).then(data => {
                    response.status(200).send("Updated")

                }
                ).catch(e => { throw (e) })

            } else {
                throw (new Error("InValid Message Id"));
            }
        }
    }).catch(e => { response.status(400).send(e.toString()) })
})
app.get("/activity", function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("Unauthorized");
        return;
    }
    //console.log("Reached")
    let activities = [];
    User.find({}, { _id: 1, activity_history: 1 }).then(data => {
        if (data.length !== 0) {
            for (let user of data) {
                let temActivity = user.activity_history;
                if (temActivity.length >= 10) {
                    temActivity = temActivity.slice(temActivity.length - 10);
                }
                temActivity = temActivity.map(activity => { activity = activity.toObject(); activity.user_id = user._id; return activity });
                activities = activities.concat(temActivity);
            }
            activities = activities.sort((e1, e2) => {
                return e2.date_time - e1.date_time;
            })
            if (activities.length >= 50) {
                activities = activities.slice(activities.length - 50);
            }
            //console.log(activities)
            response.status(200).send(JSON.stringify(activities))



        }
        else {
            throw (new Error("No Data"))

        }
    }
    ).catch(e => response.status(400).send(e.toString()))
})

/*
var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});
*/
//// websocket configuration
var http = require('http');
//const { nextTick } = require('process');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
io = io.of('/subscript')
io.use(function (socket, next) {
    if (socket.request.headers.cookie) {
        let cookies = cookie.parse(socket.request.headers.cookie);
        //console.log("cookies_1",cookies);
        cookies = cookieParser.signedCookies(cookies, 'secretKey')
        //console.log("cookies_2",cookies);
        socket.sid = cookies['connect.sid'];
        //console.log("Store",sessionStore.get[]);
        sessionStore.get(socket.sid, function (err, session) {
            if (err) {
                //console.log(err);
                next(err)

            } else {
                socket.session = session;
                //console.log("Session",session);
                next();

            }

        })

    }
})
io.on('connection', function (socket) {
    if (socket.session && socket.session.user_id) {
        subscriptorsList[socket.session.user_id] = socket;
        console.log("Subscription List", Object.keys(subscriptorsList).length);
        socket.emit("Establishment", "Request is Accpeted!");
    }

    socket.on('message', function (data) {
        console.log(data);
    });
    socket.on('disconnect', function () {
        //console.log("Disconnection");
        for (const [key, value] of Object.entries(subscriptorsList)) {
            //console.log(this);
            if (value === this) {
                delete subscriptorsList[key];
                break;
            }
        }
        console.log("Disconnection Length ", Object.keys(subscriptorsList).length);
    })
});

server.listen(app.get('port'), function () {
    console.log("%s listening on port %d in %s mode", 'your_project_name', app.get('port'), app.settings.env);
    console.log("God bless love....");
    console.log("You can visit your app with http://localhost:%d", app.get('port'));
});


function visibilityCheck(photo, user_id) {
    //console.log(photo)
    if (!photo.visibility_list) {
        //onsole.log("No List");
        return photo.user_id.toString() === user_id;
    }
    if (photo.visibility_list.length === 1 && photo.visibility_list[0] === "All") {
        //console.log("All")
        return true;
    } else if (photo.visibility_list.length === 1 && photo.visibility_list[0] === "Me") {
        //console.log("Me")
        return photo.user_id.toString() === user_id;
    } else {
        //console.log("Match");
        return photo.visibility_list.indexOf(user_id) !== -1 || photo.user_id.toString() === user_id;
    }
}

