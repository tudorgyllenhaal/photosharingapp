import React, { useState, useEffect, useContext } from 'react';
import {
  Drawer, Toolbar, List, ListItem, ListItemIcon, ListItemText,ListItemAvatar,Avatar,Link,ListItemSecondaryAction,
  Badge,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import './userList.css';
import FaceIcon from '@material-ui/icons/Face';
import PhotoIcon from '@material-ui/icons/Photo';
import CommentIcon from '@material-ui/icons/Comment';
import fetchModel from '../../lib/fetchModelData'
import photoStore from '../../dataModel/photoList'
//import dataContext from '../../dataModel/dataContext';
import briefuserstore from '../../dataModel/briefUserList';
import fireAction from '../../dataModel/fireAction';
import ActionTypes from '../../dataModel/actionTypes';
const style = {
  nav: {
    width: '100%',
  },
  ref: {
    paddingRight: '5px',
  },
  paper: {
    width:'25%'
  }
}
const useStyles = makeStyles({
  badge:{
    transform: 'rotate(15deg)',
    position: 'relative',
    marginLeft: '-1em',
  },
  paper: {
    width:'25%',
    zIndex:'inherit'
  }
});
export default function UserList(props) {

  const classes = useStyles();

  const [userList, setUserList] = useState(briefuserstore.getList());
  const [advancedList, setAdvancedList] = useState({});
  function fetchAdvancedData() {
    fetchModel("/advanced/user/list").then((data) => {
      setAdvancedList(data.data);
    }).catch((e) => console.log(e))

  }
  const onchange = () => {
    setUserList(briefuserstore.getList())

  }
  useEffect(() => {
    briefuserstore.addChangeListener(onchange);
    briefuserstore.addMinorChangeListener(onchange);
    if (userList.length === 0) {
      fetchModel("/user/list").then((data) => {
        fireAction(ActionTypes.INIT_USERS, data.data);
        setUserList(data.data)
      })
        .catch((e) => console.log(e))
    }
    return () => {briefuserstore.removeChangeListener(onchange);briefuserstore.removeMinorChangeListener(onchange)}
  }, []);

  useEffect(() => {
    if (props.advanced) {
      photoStore.addGlobalChangeListener(fetchAdvancedData);
      fetchAdvancedData();
    }
    return () => photoStore.removeGlobalChangeListener(fetchAdvancedData);
  }, [props.advanced])
  for(let user of userList){
    if(user.last_name.length>8){
      user.last_name=user.last_name[0].toUpperCase()+'.'
    }
    if(user.first_name.length>8){
      user.first_name=user.first_name[0].toUpperCase()+'.'
    }
  }
  //console.log("state value",Date.now(),userList)
  return (
    <div style={{zIndex:props.zIndexRef}} className="ULnavigationBar">
      {userList.length !== 0 &&
        <Drawer  classes={{ paper: classes.paper }} variant="permanent">
          <Toolbar />
          <List style={style.nav} >
            {userList.map((user) => {
              return (
                <ListItem key={user._id} className="ULlistItem">
                  <ListItemAvatar  className="ULiconContainer">
                    <Avatar>
                      <FaceIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={
                    <div>
                      <Link style={style.ref} href={'#/users/' + user._id} className="ULlinkToUser">
                        <Typography style={{margin:'0.5em'}} component='span' variant='h6'>{user.first_name + " " + user.last_name}</Typography>
                    </Link>
                    </div>} secondary={user.new_activity&&<Badge 
                    classes={{badge:classes.badge}}
                    color='secondary' badgeContent={user.new_activity.type.toLowerCase()}><Typography component='span' variant='body1'>{'@'+user.login_name}</Typography></Badge>}/>
                    <ListItemSecondaryAction>

                    {(props.advanced && advancedList[user._id]) && <div>
                      
                        <Badge style={{margin:'2px'}} badgeContent={advancedList[user._id].numPhotos} color="secondary">
                          <PhotoIcon color='primary'/>
                        </Badge>
                     
                      <Link href={'#/advanced/user/' + user._id + '/comment'}>
                       

                          <Badge style={{margin:'2px'}} badgeContent={advancedList[user._id].numComments} color="secondary">
                            <CommentIcon color='primary'/>
                          </Badge>

                       
                      </Link>
                    </div>}
                    </ListItemSecondaryAction>
                </ListItem>
              )
            })}
          </List>
        </Drawer>
      }
    </div>
  );
}
