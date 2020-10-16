import dispatcher from './dispatcher';
import { EventEmitter } from "events";
import ActionTypes from './actionTypes';
const LOCAL_CHANGE_EVENT = "LOCAL_CHANGE_EVENT";
const GLOBAL_CHANGE_EVENT = "GLOBAL_CHANGE_EVENT";

class UserStore extends EventEmitter {
    constructor() {
        super();
        this.user_list = [];
        this.user_dic = {};
        this._add_users=this._add_users.bind(this);
        this._update_users=this._update_users.bind(this);
        this._delete_users=this._delete_users.bind(this);
        this._clear_whole=this._clear_whole.bind(this);

    }
    addLocalChangeListener(callback) {
        //console.log("Register", callback);
        this.on(LOCAL_CHANGE_EVENT, callback);
    }

    removeLocalChangeListener(callback) {
        //console.log("Removed", callback);
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
        console.log("I am firing")
        this.emit(GLOBAL_CHANGE_EVENT);
    }

    getList() {
        return this.user_list.filter(user => { if (this.user_dic[user._id]) { return user } });
    }
    userModel = (ID) => {
        for (let user of this.user_list) {
            if (this.user_dic[user._id] && user._id === ID) {
                return {...user};
            }
        }
        return null;
    };
    _add_users(data) {
        //console.log("Gloabl Store Updateing",data);
        //this.photo_list=this.photo_list.concat(data);
        for (let user of data) {
            if (!this.user_dic[user._id]) {
                //console.log("Single",photo)
                this.user_list.push(user);
                this.user_dic[user._id] = true;
            }
        }
        //console.log(this.photo_list);
        //console.log(this.photo_list);
        this.emitLocalChange()
        this.emitGlobalChange()

    }
    _update_users(data) {
        console.log("Store Updateing");
        //this.photo_list=this.photo_list.concat(data);
        for (let user of data) {
            if (!this.user_dic[user._id]) {
                this.user_list.push(user);
                this.user_dic[user._id] = true;
            }
        }
        //console.log(this.photo_list);
        this.emitLocalChange()

    }
    _delete_users(data) {
        for (let user of data) {
            this.user_dic[photo._id] = false;
        }
        this.emitLocalChange();
        this.emitGlobalChange();
    }


    _clear_whole() {
        this.user_list = [];
        this.user_dic = {};
        this.emitLocalChange();
    }
}
const userstore = new UserStore();
dispatcher.register((action) => {
    switch (action.type) {
        case ActionTypes.ADD_USERS:
            userstore._add_users(action.data);
            break;
        case ActionTypes.UPDATE_USERS:
            userstore._update_users(action.data);
            break;
        case ActionTypes.DELETE_USERS:
            userstore._delete_users(action.data);
            break;
        case ActionTypes.CLEAR_WHOLE:
            userstore._clear_whole();
            break;

    }

})
export default userstore;