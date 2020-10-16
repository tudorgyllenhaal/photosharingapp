import React, { useState, useEffect,useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Route, Switch
} from 'react-router-dom';
import {
  Grid, Typography, Hidden, Paper, ListItem, List,ListItemText, Divider,
} from '@material-ui/core';
import axios from 'axios';
import './styles/main.css';
import './photoShare.css';

// import necessary components
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/UserDetail';
import UserList from './components/userList/UserList';
import UserPhotos from './components/userPhotos/UserPhotos';
import UserComments from './components/userComments/UserComments';
import LogIn from './components/logIn/logIn';
import AddPhotoView from './components/addPhotoView/AddPhotoView';
import Message from './components/message/Message';
import FavoriteList from './components/favoriteList/FavoriteList';
//import dataContext from './dataModel/dataContext';
import fireAction from './dataModel/fireAction';
import ActionTypes from './dataModel/actionTypes';
import loggeduserstore from './dataModel/loggedUser';
import fetchModel from './lib/fetchModelData';

import io from 'socket.io-client';
import briefuserstore from './dataModel/briefUserList';
const socket = io('/subscript');

//socket.emit("message","Hello the worild");
const zIndexStandard={
  normal:100,
  toolbar:500,
  top:1500,
}

export default function PhotoShare() {
  const [advanced, setAdvanced] = useState(false);
  const [status, setStatus] = useState("Home Page");
  const [logged, setLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [addPhotoView, setAddPhotoView] = useState(false);


  function establishWebSocket() {
    const socket = io('/subscript');

    //socket.emit("message","Hello the worild");
    socket.on("Establishment", function (data) {
      console.log("Message Recieved", data);
    })
    socket.on("LogIn", function (data) {
      data = JSON.parse(data);
      data.type='LOGIN';
      //data = { type: 'LOGIN', user_id: data.user_id, date_time: data.date_time }
      console.log(data);
      fireAction(ActionTypes.NEW_ACTIVITY, data);
    })
    socket.on("LogOut", function (data) {
      data = JSON.parse(data);
      data.type='LOGOUT';
      //data = { type: 'LOGOUT', user_id: data.user_id, date_time: data.date_time }
      console.log(data);
      fireAction(ActionTypes.NEW_ACTIVITY, data);

    })
    socket.on("NewPhoto", function (data) {
      data = JSON.parse(data);
      data.type='NEWPHOTO';
      //data = { type: 'NEWPHOTO', user_id: data.user_id, date_time: data.date_time }
      console.log(data);
      fireAction(ActionTypes.NEW_ACTIVITY, data);
    })
    socket.on("NewComment", function (data) {
      data = JSON.parse(data);
      data.type="NEWCOMMENT"
      console.log("LOOKINTO",data);
      //data = { type: 'NEWCOMMENT', user_id: data.user_id, date_time: data.date_time }
      console.log(data);
      fireAction(ActionTypes.NEW_ACTIVITY, data);
    })
    socket.on("NewUser", function (data) {
      data = JSON.parse(data);
      data.type="NEWUSER";
      //data = { type: 'NEWUSER', user_id: data.user_id, date_time: data.date_time }
      console.log(data);
      fireAction(ActionTypes.NEW_ACTIVITY, data);
    })
    socket.on("Message", function (data) {
      data = JSON.parse(data);
      console.log("Mssage", data);
      fireAction(ActionTypes.NEW_MESSAGE, data);
    })

  }

  const onlogchange = () => {
    setUser(loggeduserstore.getLoggedUser());

  }
  useEffect(() => {
    loggeduserstore.addChangeListener(onlogchange);
    axios({
      method: 'post',
      url: '/admin/test'
    })
      .then(response => { if (response.status === 200) { setLogged(true); fireAction(ActionTypes.LOG_IN, response.data) } }).catch(e => console.log(e))
    fetchModel('/user/list').then(data =>
      fireAction(ActionTypes.INIT_USERS, data.data)).catch(() => console.log("fail to initilize user list"));
    return () => loggeduserstore.removeChangeListener(onlogchange);

  }, []);

  useEffect(() => {
    if (!logged) {
      fireAction(ActionTypes.CLEAR_WHOLE);
    } else {
      establishWebSocket();
    }
  }, [logged]);



  return (

    <HashRouter>
      <div>
        <Grid container spacing={8}>
          <Grid item xs={12} className="header">
            <TopBar zIndexRef={zIndexStandard.toolbar} logged={logged} loggedUser={user} setAppLogged={setLogged} advanced={advanced} setAppAdvanced={setAdvanced} setAddPhotoView={setAddPhotoView} status={status} className="text" />
          </Grid>
          <div className="cs142-main-topbar-buffer" />
          {!logged ? <Grid container item md={12} className="body logInView">
            <LogIn zIndexRef={zIndexStandard.normal} setAppLogged={setLogged} setAppUser={setUser} /> </Grid> :
            <Grid  container item xs={12} className="body">
              <Hidden smDown>
                <Grid item md={3}>
                  <UserList zIndexRef={zIndexStandard.normal} advanced={advanced} setAppAdvanced={setAdvanced} />
                </Grid>
              </Hidden>
              <Grid item md={9} sm={12}>
                <Switch>
                  <Route exact path="/" render={props => <HomePage logged={logged} setAppState={setStatus} {...props} />} />
                  <Route path="/users/:userId"
                    render={props => <UserDetail key={props.match.params.userId} advanced={advanced} setAppState={setStatus} {...props} />}
                  />
                  <Route path="/photos/:userId"
                    render={props => <UserPhotos zIndexStandard={zIndexStandard} key={props.match.params.userId} advanced={advanced} setAppAdvanced={setAdvanced} setAppState={setStatus} {...props} />}
                  />
                  <Route path="/advanced/user/:userId/comment"
                    render={props => <UserComments key={props.match.params.userId} loggedUser={user} advanced={advanced} setAppAdvanced={setAdvanced} setAppState={setStatus} {...props} />}
                  />
                  <Route path="/favoritelist"
                    render={props => <FavoriteList setAppStatus={setStatus} {...props} />}
                  />
                  <Route path="/message"
                    render={props => <Message setAppStatus={setStatus} {...props} />} />
                </Switch>
              </Grid>
            </Grid>
          }
        </Grid>
      </div>
      {addPhotoView && <AddPhotoView setAddPhotoView={setAddPhotoView} />}
    </HashRouter>
  );
}



ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);

function HomePage(props) {
  const [activityList, setActivityList] = useState(null);
  const [userDic, setUserDic] = useState(null);
  const activityListRef=useRef(activityList);

  const generateDic = () => {
    let userList = briefuserstore.getList();
    //console.log(userList);
    let temDic = userList.reduce((e1, e2) => {
      //console.log(e2.first_name);
      e1[e2._id]={};
      e1[e2._id].first_name = e2.first_name;
      e1[e2._id].last_name = e2.last_name;
      return e1
    }, {});
    setUserDic(temDic);
  }

  const initialActivity = () => {
    fetchModel('/activity').then(data => {
      console.log("Refetch");
      setActivityList(data.data)
      activityListRef.current=data.data;
    }).catch(e => console.log(e));
  }
  const updateActivity=()=>{
    let newActivityList=briefuserstore.getList().map(user=>user.new_activity);
    newActivityList=newActivityList.sort((e1,e2)=>{
      console.log(e1.date_time,e2.date_time,Date.parse(e1.date_time)-Date.parse(e2.date_time));
      return Date.parse(e1.date_time)-Date.parse(e2.date_time)
    })
    console.log("Reference",newActivityList);
    let newLoggedActivityList=activityListRef.current.slice();
    for(let activity of newActivityList){
      if(activity._id!==activityListRef.current[0]._id&&activity.date_time>=activityListRef.current[0].date_time){
        newLoggedActivityList.unshift(activity);
      }
    }
    if(newLoggedActivityList.length>20){
      newLoggedActivityList=newLoggedActivityList.slice(0,20);
    }
    setActivityList(newLoggedActivityList);
    activityListRef.current=newLoggedActivityList;
  }
  
  useEffect(()=>{
    if(props.logged){
      initialActivity();
      generateDic();

    }

  },[props.logged])
  useEffect(() => {
    briefuserstore.addMinorChangeListener(updateActivity);
    briefuserstore.addChangeListener(generateDic);
    props.setAppState("Home Page");
    return () => {
      briefuserstore.removeMinorChangeListener(updateActivity);
      briefuserstore.removeChangeListener(generateDic);
    }

  }, [])
  return (
    <Paper style={{marginTop:'-1em'}}>
      {activityList && userDic ?
        <List>
          {activityList.map(activity => {
            return(
              <div>
            <ListItem key={activity._id}>
              <ListItemText primary={
                <Typography component="span" variant="h6">{userDic[activity.user_id] ? userDic[activity.user_id].first_name + " " + userDic[activity.user_id].last_name : "Mr.or Ms. Unknown"}
                </Typography>}
                secondary={
                  <React.Fragment>
                    <Typography
                      component="span"
                      variant="body2"

                      color="textPrimary">
                      {activity.type}
                    </Typography>
                    {" — " + new Date(Date.parse(activity.date_time))}
                  </React.Fragment>} />

            </ListItem>
            <Divider/>
            </div>
            )

          })}
        </List> : <p>No Data</p>}
    </Paper>

  )
}
