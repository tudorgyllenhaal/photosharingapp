import React, { useState, useEffect, useContext } from 'react';
import {
    List, ListItemAvatar, ListItemText, Avatar, Typography, Link
} from '@material-ui/core';
import photostore from '../../dataModel/photoList';
import briefuserstore from '../../dataModel/briefUserList';

import fetchModel from '../../lib/fetchModelData';
import './userComments.css';
//import dataContext from "../../dataModel/dataContext"
import Comments from '../comments/Comments';

function UserComments(props) {
    
    const [userId, setUserId] = useState(props.match.params.userId);
    const [comments, setComments] = useState([]);
    const [user,setUser]=useState(briefuserstore.userModel(userId));


    function fetchData(){
        fetchModel("/advanced/commentOfUser/" + userId).then(data => {
            setComments(data.data.comment);
            //props.setAppState("Comments of " + data.data.first_name + " " + data.data.last_name);
            props.setAppAdvanced(true);
        }).catch(e => console.log(e));

    }
    const onbackgroundchange=()=>{
        setUser(briefuserstore.userModel(userId))

    }
    
    useEffect(() => {
        briefuserstore.addChangeListener(onbackgroundchange)
        photostore.addGlobalChangeListener(fetchData);
        fetchData();
        return ()=>{photostore.removeGlobalChangeListener(fetchData);briefuserstore.removeChangeListener(onbackgroundchange)};
    }, [])

    useEffect(()=>{
        if(user){
            props.setAppState("Comments of " + user.first_name + " " + user.last_name);
        }else{
            fetchData();
        }

    },[user])
    return (
        <div className="UCTopContainer">
            {
                comments.length !== 0 ?
                    <List>
                        {comments.map(comment => {
                            //console.log(comment)
                            return (


                                <Comments loggedUser={props.loggedUser} photo_id={comment.Photo._id} comment={comment.Comment} avator={
                                    () => <ListItemAvatar>
                                        <Link href={"#/photos/" + comment.Photo.user_id}>
                                            <Avatar src={"/images/" + comment.Photo.file_name} variant='square' />
                                        </Link>
                                    </ListItemAvatar>
                                } />


                            )
                        })

                        }
                    </List> :
                    <p>No Comments Yet</p>
            }
        </div>
    );





}
export default UserComments;