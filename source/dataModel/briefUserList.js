import dispatcher from './dispatcher';
import { EventEmitter } from "events";
import ActionTypes from './actionTypes';

const CHANGE_EVENT = "CHANGE_EVENT";
const MINORCHANGE_EVENT = "MINORCHANGE_EVENT";

class BriefUserStore extends EventEmitter {
    constructor() {
        super();
        this.user_list = [];
        this.user_dic = {};
        this.getList = this.getList.bind(this);
    }
    addChangeListener(callback) {
        //console.log("Register", callback);
        this.on(CHANGE_EVENT, callback);
    }

    removeChangeListener(callback) {
        //console.log("Removed", callback);
        this.removeListener(CHANGE_EVENT, callback);
    }

    emitChange() {
        //console.log("Changed")
        this.emit(CHANGE_EVENT);
    }
    addMinorChangeListener(callback) {
        //console.log("Register", callback);
        this.on(MINORCHANGE_EVENT, callback);
    }

    removeMinorChangeListener(callback) {
        //console.log("Removed", callback);
        this.removeListener(MINORCHANGE_EVENT, callback);
    }

    emitMinorChange() {
        //console.log("Changed")
        this.emit(MINORCHANGE_EVENT);
    }
    getList() {
        return this.user_list.filter(user => { if (this.user_dic[user._id]) { return user } });
    }
    getDic(){
        return this.user_list.reduce((a1,a2)=>{
            a1[a2._id]={};
            a1[a2._id].first_name=a2.first_name;
            a1[a2._id].last_name=a2.last_name.length>8?a2.last_name:a2.last_name[0].toUpperCase();
            return a1
        },{})
    }
    userModel = (ID) => {
        for (let user of this.user_list) {
            if (this.user_dic[user._id] && user._id === ID) {
                return { ...user };
            }
        }
        return null;
    };
    _init_users(data) {
        this.user_list = [];
        this.user_dic = {};
        for (let user of data) {
            this.user_list.push(user);
            this.user_dic[user._id] = true;
        }
        //console.log(this.user_list);
        this.emitChange();

    }
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
        this.emitChange()


    }

    _delete_users(data) {
        for (let user of data) {
            this.user_dic[photo._id] = false;
        }
        this.emitChange();
    }

    _new_activity(data) {
        //console.log("fired")
        let index = this.user_list.findIndex(user => user._id === data.user_id);
        //console.log("Index",index);
        if (index !== -1) {
            this.user_list[index].new_activity = data;
            this.emitMinorChange()


        }

    }

    _clear_whole() {
        this.user_list = [];
        this.user_dic = {};
        this.emitChange();
    }
}
const briefuserstore = new BriefUserStore();
dispatcher.register((action) => {
    switch (action.type) {
        case ActionTypes.INIT_USERS:
            briefuserstore._init_users(action.data);
            break;
        case ActionTypes.ADD_USERS:
            briefuserstore._add_users(action.data);
            break;
        case ActionTypes.DELETE_USERS:
            briefuserstore._delete_users(action.data);
            break;
        case ActionTypes.NEW_ACTIVITY:
            briefuserstore._new_activity(action.data);
            break;
        case ActionTypes.CLEAR_WHOLE:
            briefuserstore._clear_whole();
            break;

    }

})
export default briefuserstore;