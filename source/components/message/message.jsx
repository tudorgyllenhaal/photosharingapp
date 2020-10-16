import React, { useState, useEffect, useContext } from 'react';
import {
    Grid, Paper, Card, CardActionArea, CardMedia, CardContent, Typography,Badge
} from '@material-ui/core';
import { useHistory } from "react-router-dom";
//import photostore from '../../dataModel/photoList';
import briefuserstore from '../../dataModel/briefUserList';
import loggeduserstore from '../../dataModel/loggedUser';
import Comments from '../comments/Comments';
import fetchModel from '../../lib/fetchModelData';
import axios from 'axios';
import ActionTypes from '../../dataModel/actionTypes';
import fireAction from '../../dataModel/fireAction';

//import dataContext from "../../dataModel/dataContext"
//import Comments from '../comments/Comments';

function Message(props) {
    let history = useHistory();

    const [loggedUser, setLoggedUser] = useState(loggeduserstore.getLoggedUser());
    const [mentionList, setMentionList] = useState(null);
    const [userDic, setUserDic] = useState(null);

    const fetchMessage = () => {
        setLoggedUser(loggeduserstore.getLoggedUser());
        fetchModel('/message').then(data => {
            let tem=data.data.mentions;
            setMentionList(tem);
        }).catch(e => console.log(e.toString()))
    }
    const generageDic = () => {
        let userList = briefuserstore.getList();
        let newDic = userList.reduce((e1, e2) => { e1[e2._id] = e2; return e1 }, {});
        setUserDic(newDic);
    }
    const handleimagecick=(message_id, user_id) =>{
        if (loggedUser) {
            let message = loggedUser.message_list.findIndex(message => message._id === message_id);
            if (!message.read) {
                axios.post('/readmessage/' + message_id).then(res => {
                    fireAction(ActionTypes.READ_MESSAGE, { message_id: message_id });
                    console.log("DEBUG",history)
                    history.push("/photos/" + user_id)
                }).catch(e => { console.log("[Error]", e.toString()) })

            }
        }


    }
    const handlecaptionclick=(message_id, user_id) =>{
        if (loggedUser) {
            let message = loggedUser.message_list.findIndex(message => message._id === message_id);
            if (!message.read) {
                axios.post('/readmessage/' + message_id).then(res => {
                    fireAction(ActionTypes.READ_MESSAGE, { message_id: message_id });
                    history.push("users/" + user_id)
                }).catch(e => { console.log("[Error]", e.toString()) })

            }
        }


    }


    useEffect(() => {
        console.log("Mounted");
        briefuserstore.addChangeListener(generageDic)
        loggeduserstore.addLoggedInfoChangeListener(fetchMessage);
        fetchMessage();
        generageDic();
        return () => { console.log("unmounted"); loggeduserstore.removeLoggedInfoChangeListener(fetchMessage); briefuserstore.removeChangeListener(generageDic) };
    }, [])

    useEffect(() => {
        if (loggedUser) {
            props.setAppStatus("Message  of " + loggedUser.first_name + " " + loggedUser.last_name);
        }

    }, [loggedUser])
    //console.log("Rerendering");
    
    return (
        <div className="MTopContainer">
            {
                (mentionList && userDic && mentionList.length !== 0) ?
                    <Grid container spacing={3}>
                        {mentionList.map(mention => {
                            //console.log(comment)
                            let comment = mention.Comment;
                            comment.user = { _id: comment.user_id };
                            comment.user.first_name = userDic[comment.user_id] ? userDic[comment.user_id].first_name : "";
                            comment.user.last_name = userDic[comment.user_id] ? userDic[comment.user_id].last_name : "Mr or Ms Unknown";
                            let photoUser = userDic[mention.Photo.user_id] ? userDic[mention.Photo.user_id] : { first_name: "", last_name: "Mr or Ms Mystery" }
                            let messageOnCache=loggedUser.message_list.filter(message=>message._id===mention._id);
                            messageOnCache=messageOnCache.length!==0?messageOnCache[0]:undefined;
                            let readProperty=messageOnCache?messageOnCache.read:null;
                            console.log(readProperty);
                            return (
                                <Grid item md={5}>
                                   <Badge color="secondary" badgeContent={readProperty===false?"Unread":undefined}>
                                    <Mention onImageClick={()=>handleimagecick(mention._id,mention.Photo.user_id)}
                                             onCaptionClick={()=>handlecaptionclick(mention._id,comment.user_id)}
                                             title={"Posted by " + photoUser.first_name + " " + photoUser.last_name} comment={comment} photo={mention.Photo} />
                                    </Badge>
                                </Grid>
                            )
                        })

                        }
                    </Grid> :
                    <Paper>
                        <p>No Message</p>
                    </Paper>
            }
        </div>
    );





}
function Mention(props) {
    return (
        <Card>
            <CardActionArea>
                <CardMedia
                    component="img"
                    alt={props.photo.file_name}
                    height="280"
                    image={"/images/" + props.photo.file_name}
                    onClick={props.onImageClick}
                />
                <CardContent style={{ height: "140px", overflow: 'scroll' }} >
                    <Typography variant="h6" onClick={props.onCaptionClick}>{props.title}</Typography>
                    <Comments comment={props.comment} enableDelete={false} />
                </CardContent>
            </CardActionArea>
        </Card>
    )

}
export default Message;