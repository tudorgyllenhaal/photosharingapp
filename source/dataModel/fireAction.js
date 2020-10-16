import dispatcher from "./dispatcher";
import ActionTypes from "./actionTypes";
function fireAction(type,data){
    if(ActionTypes[type]===undefined){
        return -1;
    }else{
        dispatcher.dispatch({
            type:ActionTypes[type],
            data:data
        })
    }

}
export default fireAction;