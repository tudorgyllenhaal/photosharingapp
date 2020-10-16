import React from 'react';
import {
  AppBar, Toolbar, Typography, Switch, FormControlLabel, IconButton, Link, MenuItem, ListItemIcon, ListItemText, Hidden,
  Menu, Checkbox,Badge
} from '@material-ui/core';
import { withRouter } from "react-router";
import { withStyles } from '@material-ui/core/styles';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import AddAPhotoIcon from '@material-ui/icons/AddAPhoto';
//import {Link} from 'react-router-dom';
import './TopBar.css';
import axios from 'axios';
import FavoriteIcon from '@material-ui/icons/Favorite';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import MessageIcon from '@material-ui/icons/Message';
import loggeduserstore from '../../dataModel/loggedUser';
//import { response } from 'express';

/**
 * Define TopBar, a React componment of CS142 project #5
 */
const StyledMenu = withStyles({
  paper: {
    border: '1px solid #d3d4d5',
  },
})((props) => (
  <Menu
    elevation={0}
    getContentAnchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'center',
    }}
    {...props}
  />
));
const StyledMenuItem = withStyles((theme) => ({
  root: {
    '&:focus': {
      backgroundColor: theme.palette.primary.main,
      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
        color: theme.palette.common.white,
      },
    },
    overflow:"visible",
  },
}))(MenuItem);
const titleStyle = {
  colorPrimary: {
    color: 'white'
  }
}
class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { menuAnchor: null,
                   loggedUser:loggeduserstore.getLoggedUser()};
    this.handleClick = this.handleClick.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.logout = this.logout.bind(this);
    this.deleteAccount = this.deleteAccount.bind(this);
    this.handleLoggedUser=this.handleLoggedUser.bind(this);
  }
  handleClick(e) {
    if(this.props.logged){
    this.setState({ menuAnchor: e.currentTarget })
    }
  };

  handleClose() {
    this.setState({ menuAnchor: null })
  };
  handleLoggedUser(){
    this.setState({loggedUser:loggeduserstore.getLoggedUser()})
  }
  componentDidMount(){
    loggeduserstore.addChangeListener(this.handleLoggedUser);
  }
  componentWillUnmount(){
    loggeduserstore.removeChangeListener(this.handleLoggedUser);
  }

  render() {
    return (
      <AppBar style={{zIndex:this.props.zIndexRef}} className="TBappBar" position="fixed">
        <Toolbar style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: "stretch" }}>
          <Hidden xsDown>
            <div style={{ display: "flex", alignItems: "center" }}>
              {this.props.logged &&
                <Typography variant="h6" className="TBstatus">{this.props.status}</Typography>}
            </div>
          </Hidden>
          {/*<div className="TBplaceholder" />*/}
          <div>
            <Typography variant="h3" className="TBtitle">
              <Link style={titleStyle.colorPrimary} href='#'>
                Photo Sharing App
           </Link>
            </Typography>
          </div>
          {/*<div className="TBplaceholder" />*/}
          <div style={{ display: 'flex' }}>
            <Hidden smDown>
              {this.props.logged &&
                <FormControlLabel label="Advanced"
                  control={<Switch checked={this.props.advanced} onChange={(e) => { this.props.setAppAdvanced(e.target.checked) }} />} />}
              <IconButton aria-label="Upload New Photo" onClick={() => { this.props.setAddPhotoView(true) }}>
                <AddAPhotoIcon />
              </IconButton>
            </Hidden>
            <div onClick={this.handleClick} style={{ display: "flex", alignItems: "center" }}>
              <IconButton style={{ display: "inline" }}>
                <AccountCircleIcon />

              </IconButton>
              {this.props.logged && this.props.loggedUser ?
                <Typography component="span" variant="body1" className="TBlogOut">{"Hi, " + this.props.loggedUser.first_name}</Typography> :
                <Typography component="span" variant="h6" className="TBlogIn">Log In</Typography>

              }
            </div>
          </div>
          {this.props.logged&&
          <StyledMenu
            style={{ zIndex: (this.props.zIndexRef+5).toString() }}
            id="customized-menu"
            anchorEl={this.state.menuAnchor}
            keepMounted
            open={Boolean(this.state.menuAnchor)}
            onClose={this.handleClose}>
            <StyledMenuItem  onClick={() => { this.props.setAddPhotoView(true);this.setState({ menuAnchor: null}) }}>
              <ListItemIcon>
                <AddAPhotoIcon fontSize="small" />
              </ListItemIcon>

              <ListItemText primary="Add a Photo" />
            </StyledMenuItem>
            <StyledMenuItem>
              <FormControlLabel
                control={<Checkbox checked={this.props.advanced} onChange={(e) => { this.props.setAppAdvanced(e.target.checked);this.setState({ menuAnchor: null}) }} />}
                label="Advanced">
              </FormControlLabel>
            </StyledMenuItem>
            <StyledMenuItem onClick={()=>{this.props.history.push('/favoritelist');this.setState({ menuAnchor: null})}}>
              <ListItemIcon>
                <FavoriteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Favorite Photos"/>
            </StyledMenuItem>
            <StyledMenuItem onClick={()=>{this.props.history.push('/message');this.setState({ menuAnchor: null})}}>
              <ListItemIcon>
                <MessageIcon fontSize="small" />
              </ListItemIcon>
              <Badge anchorOrigin={ {horizontal: 'right', vertical: 'top'} } color='secondary' badgeContent={this.state.loggedUser._id&&(this.state.loggedUser.message_list.filter(message=>!message.read)).length}>
              <ListItemText primary="Message"/>
              </Badge>
            </StyledMenuItem>
            <StyledMenuItem onClick={() => { this.logout(); this.setState({ menuAnchor: null });this.setState({ menuAnchor: null})}}>
              <ListItemIcon>
                <ExitToAppIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Log Out" />
            </StyledMenuItem>
            <StyledMenuItem onClick={() => { this.deleteAccount(); this.setState({ menuAnchor: null }); }}>
              <ListItemIcon>
                <AccountBoxIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Delete Account" />
            </StyledMenuItem>
          </StyledMenu>
          }


        </Toolbar>
      </AppBar>
    );

  }
  logout() {
    axios({
      method: 'post',
      url: '/admin/logout'
    })
      .then((response) => {
        if (response.status === 200) {
          this.props.setAppLogged(false);
          //this.props.setAppUser(null);
          //fireAction(ActionTypes.CLEAR_WHOLE);
        } else {
          throw (new Error(response.status))
        }
      }).catch((e) => console.log(e))
  }
  deleteAccount() {

    axios({
      method: 'delete',
      url: '/user',
    }).then((response) => {
      if (response.status === 200) {
        this.props.setAppLogged(false);
        //this.props.setAppUser(null);
        //fireAction(ActionTypes.CLEAR_WHOLE);
      } else {
        throw (new Error(response.status))
      }
    }).catch(e => console.log(e))

  }


}


export default withRouter(TopBar);
