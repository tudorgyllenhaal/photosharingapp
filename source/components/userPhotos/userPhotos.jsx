import React, { useState, useEffect, useRef } from 'react';
import {
  GridList, GridListTile, List, ListItem, ListItemText, Typography, TextField, InputAdornment,
  Divider
} from '@material-ui/core';
import {
  Route, Redirect
} from 'react-router-dom';
import './userPhotos.css';
import fetchModel from '../../lib/fetchModelData';
//import { HardwareDesktopWindows } from 'material-ui/svg-icons';
import dataContext from "../../dataModel/dataContext";
import AdvancedView from "../advancedView/AdvancedView";
import AddComment from "../addComment/AddComment";
import Comments from "../comments/Comments";
import Photos from '../photos/Photos';
import ActionTypes from "../../dataModel/actionTypes";
import fireAction from "../../dataModel/fireAction";
import briefuserstore from "../../dataModel/briefUserList";


import photostore from '../../dataModel/photoList';
export default function UserPhoto(props) {

  //let cs142models = useContext(dataContext);
  //const classes = useStyles();

  const [userId, setUserId] = useState(props.match.params.userId);
  const [photos, setPhotos] = useState([]);
  const [user, setUser] = useState(briefuserstore.userModel(userId));

  const photoRef = useRef([]);




  const resetPhotos = (reshuffle = true) => {
    console.log("DEBUG ORIGINAL")
    let photoList = photostore.photoOfUserModel(userId);
    console.log("DEBUG 11",photoList)
    if (reshuffle || photoRef.current.length === 0||photoRef.current.length!==photoList.length) {
      photoList = photoList.sort((e1, e2) => {
        //console.log(e1,e2);
        return e2.like_list.length === e1.like_list.length ? Date.parse(e2.date_time) - Date.parse(e1.date_time) : e2.like_list.length - e1.like_list.length;
      })
      setPhotos(photoList);
      photoRef.current = photoList;

    } else {
      for (let photoIndex = 0; photoIndex < photoList.length; photoIndex++) {
        let photo = photoList[photoIndex];
        let index = photoRef.current.findIndex(item => item._id === photo._id);
        if (index !== -1) {
          photoRef.current[index] = photo;
        }

      }
      console.log(photoRef.current);
      setPhotos([...photoRef.current])


    }
  }

  const onbackgroundchange = () => {
    setUser(briefuserstore.userModel(userId))

  }
  const updatePhotos = () => {
    //console.log("DEBUG FIRED")
    resetPhotos(false);
  }


  useEffect(() => {
    photostore.addLocalChangeListener(updatePhotos)
    briefuserstore.addChangeListener(onbackgroundchange)

    fetchModel("/photosOfUser/" + userId).then((data) => {
      fireAction(ActionTypes.UPDATE_PHOTOS, data.data)
    }).catch((e) => console.log(e));


    return () => {
      photostore.removeLocalChangeListener(updatePhotos);
      briefuserstore.removeChangeListener(onbackgroundchange)
    };
  }, []);

  useEffect(() => {
    if (user) {
      //console.log("Second", "Photo of " + user.first_name + " " + user.last_name);
      props.setAppState("Photo of " + user.first_name + " " + user.last_name);
    }

  });

  return (
    <div>

      <Route exact path={'/photos/:userId' + '/'} >
        {(props.advanced && photos.length !== 0) ? <Redirect to={"/photos/" + props.match.params.userId + "/advanced/" + photos[0]._id} /> :
          <div >
            {
              photos.length !== 0 ?
                <div className="UPgallery">
                  <GridList cellHeight={500} cols={8} spacing={4} >
                    {photos.map((photo) => {
                      return (
                        <GridListTile key={photo._id} cols={8} className="UPtileBorder">
                          <div className="UPtopContainer">
                            <div className="UPimageContainer">
                              <Photos zIndexRef={props.zIndexStandard.normal} photo={photo} />
                            </div>
                            <div className="UPcommentContainer">
                              <List>
                                <ListItem key="date"><Typography variant='h5'>{(new Date(Date.parse(photo.date_time)).toString())}</Typography></ListItem>
                                {(photo.comments && photo.comments.length !== 0) ? photo.comments.map((comment) => <Comments photo_id={photo._id} loggedUser={props.loggedUser} comment={comment} />)
                                  : <div key="NO DATA"><ListItem component='p'>NO COMMENTS YET</ListItem><Divider /></div>
                                }
                                <AddComment key="addComment" photoId={photo._id} />
                              </List>
                            </div>
                          </div>
                        </GridListTile>
                      )
                    })
                    }
                  </GridList>
                </div>
                : <p>NO DATA FOUND</p>
            }


          </div>
        }
      </Route>
      <Route path={'/photos/:userId/advanced/:id'} render={(routeProps) => {
        //sync index and id
        if (photos.length === 0) {//no photo in top app
          return (<AdvancedView key={null} zIndexRef={props.zIndexStandard.top}
            photoId={null} enablePre={false} enableNext={false} returnPage={"/users/" + userId} setAppAdvanced={props.setAppAdvanced} {...routeProps} />);
        } else {
          let index = photos.findIndex((photo) => photo._id === routeProps.match.params.id);
          if (index === -1) { //no maching
            return (<AdvancedView key={null} zIndexRef={props.zIndexStandard.top}
              photoId={null} enablePre={false} enableNext={false} returnPage={"/users/" + userId} setAppAdvanced={props.setAppAdvanced} {...routeProps} />);
          }
          return (
            <AdvancedView zIndexRef={props.zIndexStandard.top} key={routeProps.match.params.id}
              photoId={index !== null ? photos[index]._id : null}
              enablePre={(index !== null && index > 0) ? "/photos/" + routeProps.match.params.userId + "/advanced/" + photos[index - 1]._id : null}
              enableNext={(index !== null && index < photos.length - 1) ? "/photos/" + routeProps.match.params.userId + "/advanced/" + photos[index + 1]._id : null}
              returnPage={"/users/" + userId}
              setAppAdvanced={props.setAppAdvanced}
              history={props.history}{...routeProps}
            />
          )
        }
      }} />


    </div>


  );

}
