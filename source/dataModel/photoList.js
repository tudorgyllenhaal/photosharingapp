import dispatcher from './dispatcher';
import { EventEmitter } from "events";
import ActionTypes from './actionTypes';
const LOCAL_CHANGE_EVENT = "LOCAL_CHANGE_EVENT";
const GLOBAL_CHANGE_EVENT = "GLOBAL_CHANGE_EVENT";

class PhotoStore extends EventEmitter {
    constructor() {
        super();
        this.photo_list = [];
        this.photo_dic = {};
    }
    addLocalChangeListener(callback) {
        //console.log("Register",callback);
        this.on(LOCAL_CHANGE_EVENT, callback);
    }

    removeLocalChangeListener(callback) {
        //console.log("Removed",callback);
        this.removeListener(LOCAL_CHANGE_EVENT, callback);
    }

    emitLocalChange() {
        //console.log("Changed")
        this.emit(LOCAL_CHANGE_EVENT);
    }
    addGlobalChangeListener(callback) {
        this.on(GLOBAL_CHANGE_EVENT, callback);
    }

    removeGlobalChangeListener(callback) {
        this.removeListener(GLOBAL_CHANGE_EVENT, callback);
    }

    emitGlobalChange() {
        //console.log("I am firing")
        this.emit(GLOBAL_CHANGE_EVENT);
    }

    getList() {
        return this.photo_list.filter(photo=>{if(this.photo_dic[photo._id]){return photo}});
    }
    photoOfUserModel(userId) {
        return this.photo_list.filter((photo) => {
            return (this.photo_dic[photo._id] && photo.user_id === userId);
        });
    }
    photoModel = (ID) => {
        if (this.photo_dic[ID]) {
            for (let photo of this.photo_list) {
                if (photo._id == ID) {
                    return photo;
                }
            }
            return null;
        }
    }
    _init_photos(data) {
        for (let photo of data) {
            this.photo_list.push(photo);
            this.photo_dic[photo._id] = true;
        }
        this.emitLocalChange();

    }
    _add_photos(data){
        console.log("Gloabl Store Updateing",data);
        //this.photo_list=this.photo_list.concat(data);
        for (let photo of data) {
            if (!this.photo_dic[photo._id]) {
                //console.log("Single",photo)
                this.photo_list.push(photo);
                this.photo_dic[photo._id] = true;
            }
        }
        //console.log(this.photo_list);
        //console.log(this.photo_list);
        this.emitLocalChange()
        this.emitGlobalChange()

    }
    _update_photos(data) {
        //console.log("Store Updateing");
        //this.photo_list=this.photo_list.concat(data);
        for (let photo of data) {
            if (!this.photo_dic[photo._id]) {
                this.photo_list.push(photo);
                this.photo_dic[photo._id] = true;
            }
        }
        //console.log(this.photo_list);
        this.emitLocalChange()

    }
    _delete_photos(data) {
        for (let photo of data) {
            this.photo_dic[photo._id] = false;
        }
        this.emitLocalChange();
        this.emitGlobalChange();
    }
    _add_like(data) {
        if (this.photo_dic[data.photo_id]) {
            let index = this.photo_list.findIndex(photo => photo._id === data.photo_id);
            if (index !== -1) {
                if (this.photo_list[index].like_list.indexOf(data.user_id) === -1) {
                    this.photo_list[index].like_list.push(data.user_id);
                }
            }
            this.emitLocalChange();
            //this.emitGlobalChange();
        }
        this.emitGlobalChange();
    }
    _remove_like(data) {
        if (this.photo_dic[data.photo_id]) {
            let index = this.photo_list.findIndex(photo => photo._id === data.photo_id);
            if (index !== -1) {
                let like_index = this.photo_list[index].like_list.indexOf(data.user_id);
                if (like_index !== -1) {
                    this.photo_list[index].like_list.splice(like_index, 1);
                }
            }
            this.emitLocalChange();
            //this.emitGlobalChange();
        }
        this.emitGlobalChange();
    }
    _add_comment(data) {
        console.log("H1")
        if (this.photo_dic[data.photo_id]) {
            //console.log("H2", data.photo_id)
            //console.log(this.photo_list);
            let index = this.photo_list.findIndex(photo => { return photo._id === data.photo_id });
            //console.log(index);
            if (index !== -1) {
                //console.log("H3")
                let comment_index = this.photo_list[index].comments.indexOf(comment => comment._id === data.comment._id);
                if (comment_index === -1) {
                    this.photo_list[index].comments.push(data.comment);
                }
            }
            this.emitLocalChange();
           // this.emitGlobalChange();
        }
        this.emitGlobalChange();

    }
    _remove_comment(data) {
        //console.log(data);
        if (this.photo_dic[data.photo_id]) {
            //console.log("Here I am");
            let index = this.photo_list.findIndex(photo => photo._id === data.photo_id);
            //console.log("Index",index)
            if (index !== -1) {
                let comment_index = this.photo_list[index].comments.findIndex(comment=>comment._id===data.comment._id);
                if (comment_index !== -1) {
                    this.photo_list[index].comments.splice(comment_index, 1);
                }
            }
            this.emitLocalChange();
            //this.emitGlobalChange();
        }

        this.emitGlobalChange();
    }
    _clear_whole() {
        this.photo_list = [];
        this.photo_dic = {};
        this.emitLocalChange();
    }
}
const photostore = new PhotoStore();
dispatcher.register((action) => {
    switch (action.type) {
        case ActionTypes.INIT_PHOTOS:
            photostore._init_photos(action.data);
            break;
        case ActionTypes.UPDATE_PHOTOS:
            photostore._update_photos(action.data);
            break;
        case ActionTypes.DELETE_PHOTOS:
            photostore._delete_photos(action.data);
            break;
        case ActionTypes.ADD_PHOTOS:
            photostore._add_photos(action.data);
            break;
        case ActionTypes.ADD_LIKE:
            photostore._add_like(action.data);
            break;
        case ActionTypes.REMOVE_LIKE:
            photostore._remove_like(action.data);
            break;
        case ActionTypes.ADD_COMMENT:
            photostore._add_comment(action.data);
            break;
        case ActionTypes.REMOVE_COMMENT:
            photostore._remove_comment(action.data);
            break;
        case ActionTypes.CLEAR_WHOLE:
            photostore._clear_whole();
            break;
        
    }

})
export default photostore;