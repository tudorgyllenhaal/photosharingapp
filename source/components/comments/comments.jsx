import React, { useState, useEffect } from 'react';
import {
    ListItem, ListItemText, Typography, Divider, ListItemSecondaryAction,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import axios from 'axios';
import ActionTypes from "../../dataModel/actionTypes";
import fireAction from "../../dataModel/fireAction";
import loggeduserstore from "../../dataModel/loggedUser";

const reg = /<<\(\{\{(\w+)\?\?(\w+)\}\}\)>>/g;

function handleDelete(comment, photo_id) {

    axios.delete('/commentsOfPhoto/' + photo_id + "/" + comment._id)
        .then(() => fireAction(ActionTypes.REMOVE_COMMENT, { photo_id: photo_id, comment: comment }))
        .catch(e => console.log(e.toString()))

}
function Comments(props) {
    const [comment, setComment] = useState(props.comment.comment);
    const [mentionList, setMentionList] = useState([]);
    const [loggedUser,setLoggedUser]=useState(loggeduserstore.getLoggedUser());
    //console.log("Here I am",props.comment.comment)

    const onLoggedChange=()=>{
        setLoggedUser(loggeduserstore.getLoggedUser());
    }

    useEffect(() => {
        loggeduserstore.addLoggedInfoChangeListener(onLoggedChange);
        //console.log("I am called");
        let newComment = "";
        let newMentionList = [];
        const matchs = [...comment.matchAll(reg)];
        let formerMatch;
        //console.log("Length",matchs.length)
        if (matchs.length !== 0) {
            for (let i = 0; i < matchs.length; i++) {
                let match = matchs[i];
                if (!formerMatch) {
                    newComment += comment.slice(0, match.index)
                } else {
                    newComment += comment.slice(formerMatch.index + formerMatch[0].length, match.index)
                }
                newComment += "@";
                newComment += match[1]
                newMentionList.push(match[2])
                formerMatch = match;
                if (i === matchs.length - 1) {
                    newComment += comment.slice(formerMatch.index + formerMatch[0].length);
                }
            }
            //console.log("New Comment", newComment)
        } else {
            newComment = comment;
        }
        setComment(newComment);
        setMentionList(newMentionList);

        return ()=>loggeduserstore.removeLoggedInfoChangeListener(onLoggedChange);







    }, [])

    return (
        <div key={props.comment._id}>
            <ListItem>

                {props.avator && React.createElement(props.avator)}
                <ListItemText primary={
                    <Typography component="span" variant="h6">{props.comment.user.first_name + " " + props.comment.user.last_name}
                    </Typography>}
                    secondary={
                        <React.Fragment>
                            <Typography
                                component="span"
                                variant="body2"

                                color="textPrimary">
                                {comment}
                            </Typography>
                            {" — " + new Date(Date.parse(props.comment.date_time))}
                        </React.Fragment>} />
                {props.enableDelete!==false&& loggedUser && loggedUser._id === props.comment.user._id &&
                    <ListItemSecondaryAction onClick={() => handleDelete(props.comment, props.photo_id)}>

                        <div style={{ display: "inline", margin: "0.5em" }}>
                            <DeleteIcon />
                        </div>

                    </ListItemSecondaryAction>
                }
            </ListItem>
            <Divider />

        </div>
    )
}
export default Comments;