import React, { useState, useEffect } from 'react';
import { Fab, IconButton, Typography, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import FavoriteIcon from '@material-ui/icons/Favorite';
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DeleteIcon from '@material-ui/icons/Delete';
import ThumbUpAltIcon from '@material-ui/icons/ThumbUpAlt';
import ThumbUpAltOutlinedIcon from '@material-ui/icons/ThumbUpAltOutlined';
import axios from 'axios';
import fireAction from '../../dataModel/fireAction';
//import photoshare from '../../dataModel/photoList';
import actionTypes from '../../dataModel/actionTypes';
import loggeduserstore from '../../dataModel/loggedUser';
import briefuserstore from '../../dataModel/briefUserList';

import './photos.css'
import ActionTypes from '../../dataModel/actionTypes';
//import photostore from '../../dataModel/photoList';

const style = {
    Fab: {
        margin: '0.5em'

    }
}
function getStyle(display,rest={}) {
    if(display){
        rest.visibility='visible';
    }else{
        rest.visibility='hidden';
    }
    return rest;

}
function getPosition(window) {
    window = window.map(item => item < 0 ? 0 : item);
    window = window.map(item => item > 1 ? 1 : item);
    window[2] = window[2] - window[0];
    window[3] = window[3] - window[1];
    window = window.map(item => {
        let tem = item * 100;
        tem = Math.trunc(tem);
        return tem.toString() + '%';
    })
    return ({ left: window[0], top: window[1], width: window[2], height: window[3] });
}
const useStyles = makeStyles({
    popper: {
        zIndex: '1900'
    },
    tooltip: {
        fontSize: 'medium'

    }
});
function handleLike(user, photo) {
    if (photo.like_list.indexOf(user._id) === -1) {
        axios.post('/photo/like/' + photo._id).then(res => {
            fireAction(actionTypes.ADD_LIKE, { photo_id: photo._id, user_id: user._id });
            //console.log("Add Succeed!")
        }).catch(e => { console.log("[Error]", e.toString()) })
    } else {
        axios.delete('/photo/like/' + photo._id).then(res => {
            fireAction(actionTypes.REMOVE_LIKE, { photo_id: photo._id, user_id: user._id });
            //console.log("Delete Succeed!")
        }).catch(e => { console.log("[Error]", e.toString()) })

    }
}
function handleFavorite(user, photo) {
    if (user.favorite_list.indexOf(photo._id) === -1) {
        axios.post('/user/favorite/' + photo._id).then(res => {
            fireAction(ActionTypes.ADD_FAVORITE, { photo_id: photo._id })
            //console.log("Add Succeed!")
        }).catch(e => { console.log("[Error]", e.toString()) })
    } else {
        axios.delete('/user/favorite/' + photo._id).then(res => {
            fireAction(ActionTypes.REMOVE_FAVORITE, { photo_id: photo._id })
            //console.log(" Delete Succeed!")
        }).catch(e => { console.log("[Error]", e.toString()) })
    }
}
function handleDelete(photo, options) {
    axios.delete('/photos/delete/' + photo._id).then(res => {
        fireAction(actionTypes.DELETE_PHOTOS, [photo]);
        if (options.nextLink) {
            options.history.replace(options.nextLink);
        } else if (options.beforeLink) {
            options.history.replace(options.beforeLink);
        } else if (options.returnLink) {
            options.history.replace(options.returnLink);
        }
        //console.log("Delete Succeed!");
    }).catch(e => { console.log(e.toString()) })
}

function Photos(props) {
   
    const classes=useStyles();
    const [showControl, setShowControl] = useState(false);
    const [loggedUser, setPhotosLoggedUser] = useState(loggeduserstore.getLoggedUser());
    const [userDic, setUserDic] = useState(briefuserstore.getDic());
    const [imgRef,setImgRef]=useState(null);
    const [openList,setOpenList]=useState(props.photo.tag_list.map(item=>false));
    //console.log('[Debug]',props.photo.tag_list.map(item=>{console.log(item);return false}));
    function reset() {
        let tem = loggeduserstore.getLoggedUser();

        setPhotosLoggedUser(tem);
        //setFavList(tem.favorite_list);

    }
    function refetchDic() {
        setUserDic(briefuserstore.getDic());
    }
    function onMouseMove(e){
        //console.log("DEBUG Move")
        if(imgRef){
            let bound = imgRef.getClientRects()[0];
            let X=e.clientX;
            let Y=e.clientY;
            if(X<bound.left||X>bound.right){
                return
            }
            if(Y<bound.top||Y>bound.bottom){
                return
            }
            X=(X-bound.left)/(bound.right-bound.left);
            Y=(Y-bound.top)/(bound.bottom-bound.top);
            let newOpenList=[];
            for(let tag of props.photo.tag_list){
                let window=tag.window;
                window=window.map(item=>item<0?0:item);
                window=window.map(item=>item>1?1:item);
                if(X>=window[0]&&X<=window[2]&&Y>=window[1]&&Y<=window[3]){
                    newOpenList.push(true);
                }else{
                    newOpenList.push(false);
                }
            }
            setOpenList(newOpenList);
        }
    }
    useEffect(() => {
        loggeduserstore.addChangeListener(reset);
        briefuserstore.addChangeListener(refetchDic);


        return () => {
            loggeduserstore.removeChangeListener(reset);
            briefuserstore.removeChangeListener(refetchDic);
        };

    }, [])

    //console.log("Rerender",Date.now())
    return (
        loggedUser &&
        <div style={{zIndex:props.zIndexRef+5}} className="PtopContainer">
            <div  style={{zIndex:props.zIndexRef+10}} className="PcontrolContainerBackground" onMouseEnter={() => setShowControl(true)}></div>
            <div className="PcontrolContainer" style={getStyle(showControl,{zIndex:props.zIndexRef+20})} onMouseLeave={() => setShowControl(false)}>
                <Fab style={style.Fab} color="default" aria-label="more">
                    <MoreVertIcon />
                </Fab>

                {
                    props.photo.user_id === loggedUser._id &&
                    <Fab style={style.Fab} color="default" aria-label="delete photo" onClick={() => handleDelete(props.photo, {
                        history: props.history,
                        nextLink: props.nextLink, beforeLink: props.beforeLink, returnLink: props.returnLink
                    })}>
                        <DeleteIcon />
                    </Fab>
                }
                <Fab style={style.Fab} color="default" aria-label="favorite this photo" onClick={() => { console.log("Click"); handleFavorite(loggedUser, props.photo) }}>
                    {loggedUser.favorite_list.indexOf(props.photo._id) == -1 ?
                        <FavoriteBorderIcon /> :
                        <FavoriteIcon />
                    }
                </Fab>
            </div>
            <div className="PimageContainer" onMouseMove={onMouseMove}>
                <img src={"/images/" + props.photo.file_name} ref={(fileRef)=>setImgRef(fileRef)}/>
                {props.photo.tag_list.map((tag,index) =>
                    <Tooltip style={{zIndex:props.zindexRef+5}} classes={{tooltip:classes.tooltip}} arrow open={openList[index]}
                     placement='top' title={tag.user_list.reduce((a1,a2)=>{
                        if(a1.length!==0){
                            a1+=", "
                        }
                        let user=userDic[a2];
                        a1=a1+(user?user.first_name+" "+user.last_name:"Mr/Mrs. Unknown");
                        return a1
                         },"")}>
                        <div style={getPosition(tag.window)} className='PimageTagWindow'></div>
                    </Tooltip>

                )}
            </div>
            <div className="PlikeContainer">
                <div>
                    <IconButton style={style.Fab} aria-label="like the Photo" onClick={() => handleLike(loggedUser, props.photo)}>
                        {props.photo.like_list.indexOf(loggedUser._id) === -1 ?
                            <ThumbUpAltOutlinedIcon /> :
                            <ThumbUpAltIcon />

                        }
                    </IconButton>

                </div>
                <Typography
                    component="span"
                    variant="body2"

                    color="textPrimary">
                    {"Liked by " + props.photo.like_list.length}
                </Typography>


                <div>

                </div>


            </div>
        </div>

    )
}
export default Photos;