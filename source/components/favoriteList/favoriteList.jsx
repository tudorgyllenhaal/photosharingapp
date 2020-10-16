import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";
import {
  GridList, GridListTile, GridListTileBar, Paper,
} from '@material-ui/core';
import fetchModel from '../../lib/fetchModelData';
import ActionTypes from '../../dataModel/actionTypes';
import fireAction from '../../dataModel/fireAction';
import loggeduserstore from '../../dataModel/loggedUser';
//import loggeduserstore from '../../dataModel/loggedUser';
import FavoriteIcon from '@material-ui/icons/Favorite';
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import axios from 'axios';

function FavoriteList(props) {
  let history = useHistory();
  const [favoriteList, setFavoriteList] = useState(null);
  const [favorDic, setFavorDic] = useState(null);
  const [largerId, setLargerId] = useState(null)
  const [loggedUser, setLoggedUser] = useState(loggeduserstore.getLoggedUser())

  const onLoggedChange = () => {
    let newLogged = loggeduserstore.getLoggedUser();

    fetchData();

    setLoggedUser(newLogged);
  }

  useEffect(() => {
    loggeduserstore.addLoggedInfoChangeListener(onLoggedChange);
    if (!favoriteList) {
      fetchData();
    }
    return () => loggeduserstore.removeLoggedInfoChangeListener(onLoggedChange);
  }, [])
  useEffect(() => {
    if (loggedUser) {
      props.setAppStatus("FPhotos of " + loggedUser.first_name + " " + loggedUser.last_name);
    }
  }, [loggedUser]);

  function handlefavorite(ID) {
    if (!favorDic[ID]) {
      axios.post('/user/favorite/' + ID).then(res => {
        let tem = { ...favorDic };
        tem[ID] = true;
        setFavorDic(tem);
        fireAction(ActionTypes.ADD_FAVORITE, { photo_id: ID });
        //setFavorDic(tem);
      }
      ).catch(e => console.log(w))
    } else {
      axios.delete('/user/favorite/' + ID).then(res => {
        let tem = { ...favorDic };
        tem[ID] = false;
        setFavorDic(tem);
        fireAction(ActionTypes.REMOVE_FAVORITE, { photo_id: ID });
        //setFavorDic(tem);
      })
    }
  }

  function fetchData() {
    fetchModel('/favoritelist').then(data => {
      //console.log(data.data)
      let new_dic = data.data.reduce((a1, a2) => { a1[a2._id] = true; return a1 }, {})
      console.log(new_dic);
      setFavorDic(new_dic);
      setFavoriteList(data.data)
    }).catch(e => console.log(e));
  }
  return (
    <Paper>
      <GridList cellHeight={180} cols={3}>
        {favoriteList && favoriteList.length !== 0 ?
          favoriteList.map(photo => {
            return (
              <GridListTile key={photo._id} cols={largerId === photo._id ? 2 : 1} rows={largerId === photo._id ? 2 : 1}>
                <img src={'/images/' + photo.file_name} onClick={() => { if (largerId !== photo._id) { setLargerId(photo._id) } else { history.push('/photos/' + photo.user_id + '/advanced/' + photo._id) } }} />
                <GridListTileBar title={photo.date_time}
                  actionIcon={
                    favorDic[photo._id] ? <FavoriteIcon color='secondary' onClick={() => handlefavorite(photo._id)} /> : <FavoriteBorderIcon color='secondary' onClick={() => handlefavorite(photo._id)} />
                    //<FavoriteIcon/>
                  }>


                </GridListTileBar>
              </GridListTile>
            )

          }) : <p>NO DATA</p>

        }

      </GridList>
    </Paper>
  )

}

export default FavoriteList;