import React, { useState, useEffect, useContext } from 'react';
import {
  Paper, List, ListItem, ListItemText, ListItemIcon, Typography, Tooltip, GridList, GridListTile, Link,
  GridListTileBar, IconButton,
} from '@material-ui/core';
//import {Link} from 'react-router-dom';
import fetchModel from '../../lib/fetchModelData';
import './userDetail.css';
import photostore from '../../dataModel/photoList';
import userstore from '../../dataModel/userList';
import fireAction from '../../dataModel/fireAction';
import ActionTypes from '../../dataModel/actionTypes';

import InsertEmoticonSharpIcon from '@material-ui/icons/InsertEmoticonSharp';
import LocationOnSharpIcon from '@material-ui/icons/LocationOnSharp';
import DescriptionSharpIcon from '@material-ui/icons/DescriptionSharp';
import WorkIcon from '@material-ui/icons/Work';
import LinkIcon from '@material-ui/icons/Link';
import MoreVertIcon from '@material-ui/icons/MoreVert';
//import dataContext from '../../dataModel/dataContext'

const style = {
  paper: {
    marginBottom: '1em',
  },
  gridlist: {
    margin: '1em',
  },
  gridlistitem: {
    marginTop: '1em',
    marginBottom: '1em',
  }
}
/**
 * Define UserDetail, a React componment of CS142 project #5
 */
export default function UserDetail(props) {
  //let cs142models=props.scope;
  //let cs142models = useContext(dataContext);
  const queryUser = userstore.userModel(props.match.params.userId);
  const [userId, setUserId] = useState(props.match.params.userId);
  const [user, setUser] = useState(queryUser);

  function fetchData(){
    //console.log("Refresh",user);
    fetchModel("/user/" + userId).then((data) => {
      fireAction(ActionTypes.UPDATE_USERS,[data.data])
      //setUser(data.data);
    }).catch(e=>console.log(e));
  };

  function onCacheChange(){
    //console.log("Cache changed");
    let newUser=userstore.userModel(userId);
    setUser(newUser);
  }
    

 
  useEffect(() => {
    photostore.addGlobalChangeListener(fetchData);
    userstore.addLocalChangeListener(onCacheChange)
    
    if (!user) {
      fetchData();
    }
    return ()=>{photostore.removeGlobalChangeListener(fetchData);
                userstore.removeLocalChangeListener(onCacheChange)};
  }, []);

  useEffect(() => {
    if (user) {
      if (props.setAppState) {
        props.setAppState(user.first_name + " " + user.last_name);
      }
    }
  })
  
  return (
    <div className="UDtopView">
      <Paper style={style.paper}>
        {user ?

          <List component="ul">
            <ListItem key="name">
              <ListItemIcon><InsertEmoticonSharpIcon /></ListItemIcon>
              <ListItemText primary={"NAME: " + user.first_name + " " + user.last_name} />
            </ListItem>
            <ListItem key="location">
              <ListItemIcon><LocationOnSharpIcon /></ListItemIcon>
              <ListItemText primary={"LOCATION: " + user.location} />
            </ListItem>
            <ListItem key="description">
              <ListItemIcon><DescriptionSharpIcon /></ListItemIcon>
              <Tooltip title={user.description} arrow placement="bottom-start">
                <Typography component="p">
                  {"DESCRIPTION: " + user.description}
                </Typography>
              </Tooltip>

            </ListItem>
            <ListItem key="occupation">
              <ListItemIcon><WorkIcon /></ListItemIcon>
              <ListItemText primary={"OCCUPATION: " + user.occupation} />
            </ListItem>
            <ListItem key="link">
              <ListItemIcon><LinkIcon /></ListItemIcon>
              <Link href={"#/photos/" + userId}>To Phtotes</Link>
            </ListItem>
          </List>

          : <p>NO DATA FOUND</p>
        }
      </Paper>
      {props.advanced &&
        <Paper style={style.paper}>
          {user ?
            <GridList cellHeight={250} cols={8} spacing={4} style={style.gridlist}>
              {Object.keys(user.newPhoto).length !== 0 &&
                <GridListTile key={'latest' + user.newPhoto._id} cols={3} style={style.gridlistitem}>
                  <Link style={{width:'100%',height:'100%',position:'absolute'}} href={'#/photos/' + user.newPhoto.user_id + "/advanced/" + user.newPhoto._id}>
                    <img style={{width:'100%',height:'100%'}} src={'/images/' + user.newPhoto.file_name} />
                    <GridListTileBar
                      title="Latest Photo"
                      subtitle={user.newPhoto.date_time}
                      actionIcon={<IconButton>
                        <MoreVertIcon color='secondary' />
                      </IconButton>}
                    />
                  </Link>
                </GridListTile>
              }

              {Object.keys(user.poPhoto).length !== 0 &&
                <GridListTile key={"popular" + user.poPhoto._id} cols={3} style={style.gridlistitem}>
                  <Link style={{width:'100%',height:'100%'}} href={'#/photos/' + user.poPhoto.user_id + "/advanced/" + user.poPhoto._id}>
                    <img style={{width:'100%',height:'100%'}} src={'/images/' + user.poPhoto.file_name} />

                    <GridListTileBar
                      title="Most Commented Photo"
                      subtitle={user.poPhoto.comments.length.toString()}
                      actionIcon={<IconButton>
                        <MoreVertIcon color='secondary' />
                      </IconButton>}
                    />
                  </Link>
                </GridListTile>

              }

            </GridList>
            : <p>NO DATA</p>}

        </Paper>
      }
    </div>
  );
}

