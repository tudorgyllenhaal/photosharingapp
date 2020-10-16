import dispatcher from './dispatcher';
import { EventEmitter } from "events";
import ActionTypes from './actionTypes';
const CHANGE_EVENT = "CHANGE_EVENT";
const LOGGEINFOCHANGE_EVENT = "LOGGEDINFO_EVENT";

class LoggedUserStore extends EventEmitter {
    constructor() {
        super();
        this.loggedUser = {};
    }
    addLoggedInfoChangeListener(callback) {
        //console.log("Register", callback);
        this.on(LOGGEINFOCHANGE_EVENT, callback);
    }

    removeLoggedInfoChangeListener(callback) {
        //console.log("Removed", callback);
        this.removeListener(LOGGEINFOCHANGE_EVENT, callback);
    }

    emitLoggedInfoChange() {
        //console.log("Changed")

        this.emit(LOGGEINFOCHANGE_EVENT);
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


    getLoggedUser() {
        return { ...this.loggedUser };
    }

    _login(data) {
        this.loggedUser = data;
        this.emitChange();
        this.emitLoggedInfoChange();
    }
    _add_favorite(data) {
        //console.log("Add F",this.loggedUser.favorite_list.length);

        if (this.loggedUser.favorite_list.indexOf(data.photo_id) === -1) {
            this.loggedUser.favorite_list.push(data.photo_id);
        }
        //console.log("New LIst",this.loggedUser.favorite_list.length)
        this.emitChange();
        //this.emitGlobalChange();

    }
    _remove_favorite(data) {

        //console.log("Remove F");
        let favorite_index = this.loggedUser.favorite_list.indexOf(data.photo_id);
        if (favorite_index !== -1) {
            this.loggedUser.favorite_list.splice(favorite_index, 1);
        }

        this.emitChange();


    }
    _read_message(data) {
        let message_list = this.loggedUser.message_list;
        let index = message_list.findIndex(message => message._id === data.message_id);
        //console.log(index);
        if (index !== -1) {
            if (!message_list[index].read) {
                message_list[index].read = true;
                //onsole.log("Changed", this.loggedUser)
                this.emitChange();
            }
        }
    }
    _new_message(data){
        this.loggedUser.message_list.push(data);
        this.emitChange();
    }
    _clear_whole() {
        this.loggedUser = {};
        this.emitChange();
        this.emitLoggedInfoChange();
    }
}
const loggeduserstore = new LoggedUserStore();
dispatcher.register((action) => {
    switch (action.type) {
        case ActionTypes.LOG_IN:
            loggeduserstore._login(action.data);
            break;
        case ActionTypes.ADD_FAVORITE:
            loggeduserstore._add_favorite(action.data);
            break;
        case ActionTypes.REMOVE_FAVORITE:
            loggeduserstore._remove_favorite(action.data);
            break;
        case ActionTypes.READ_MESSAGE:
            loggeduserstore._read_message(action.data);
            break;
        case ActionTypes.NEW_MESSAGE:
            loggeduserstore._new_message(action.data);
            break;
        case ActionTypes.CLEAR_WHOLE:
            loggeduserstore._clear_whole();
            break;

    }

})
export default loggeduserstore;