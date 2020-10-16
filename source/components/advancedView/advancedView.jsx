import React, { useState, useEffect } from 'react';
import {
  Grid, List, ListItem, Typography, Divider, Fab, TextField, InputAdornment
} from '@material-ui/core';
import './advancedView.css';
import {
  Link
} from 'react-router-dom';
//import { HardwareDesktopWindows } from 'material-ui/svg-icons';
import dataContext from "../../dataModel/dataContext"
import CloseIcon from '@material-ui/icons/Close';
import ShareIcon from '@material-ui/icons/Share';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
//import axios from 'axios';
import AddComment from '../addComment/AddComment';
import Comments from '../comments/Comments';
import Photos from '../photos/Photos';



import photostore from '../../dataModel/photoList';

function AdvancedView(props) {
  //let cs142models = useContext(dataContext);

  let [photoId, setPhotoId] = useState(props.photoId);
  let [photo, setPhoto] = useState(photostore.photoModel(photoId))


  useEffect(() => {
    //console.log(props.setAppAdvanced);
    if (props.setAppAdvanced) {
      props.setAppAdvanced(true);

    }
  }, []);

  return (
    <div>


      <div className="AVbackground" style={{zIndex:props.zIndexRef}} />
      <div className="AVadvanedView" style={{zIndex:props.zIndexRef}} >
        <div className="AVcontrolContainer">
          <div className="AVcontrolButton">
            <Fab color="primary" aria-label="Copy URL">
              <ShareIcon />
            </Fab>
          </div>
          <div className="AVcontrolButton">
            <Link to={props.returnPage}>
              <Fab color="primary" aria-label="back">
                <CloseIcon />
              </Fab>
            </Link>
          </div>
        </div>
        <div className="AVtopcontainer">
          <div className="AVprePhoto">
            {props.enablePre &&
              <Link to={props.enablePre}>
                <ArrowBackIosIcon fontSize="large" color="primary" />
              </Link>
            }
          </div>
          {photo ?
            <Grid className="AVinterContainer">
              <div className="AVimageContainer">
                <Photos zIndexRef={props.zIndexRef} photo={photo} history={props.history} beforeLink={props.enablePre} nextLink={props.enableNext} returnLink={props.returnPage} />
              </div>
              <div className="AVcommentContainer">
                <List>
                  <ListItem key="date"><Typography variant='h5'>{(new Date(Date.parse(photo.date_time)).toString())}</Typography></ListItem>
                  {(photo.comments && photo.comments.length !== 0) ? photo.comments.map((comment) => <Comments photo_id={photo._id} loggedUser={props.loggedUser} comment={comment} />)
                    : <div key="No Commnets"><ListItem component='p'>NO COMMENTS YET</ListItem><Divider /></div>
                  }
                  <AddComment key="addComment" photoId={photo._id} />
                </List>


              </div>
            </Grid> : <p>PLACE HOLDER</p>
          }
          <div className="AVnextPhoto" onClick={props.increIndex}>
            {props.enableNext &&
              <Link to={props.enableNext}>
                <ArrowForwardIosIcon fontSize="large" color="primary" />
              </Link>
            }
          </div>
        </div>
      </div>
    </div>

  );
}
export default AdvancedView;