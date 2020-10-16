import React, { useState, useEffect } from 'react';
import {
    Grid, Typography, TextField, Button, FormControl, InputAdornment
} from '@material-ui/core';
import './logIn.css';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import FaceIcon from '@material-ui/icons/Face';
import AddLocationIcon from '@material-ui/icons/AddLocation';
import WorkIcon from '@material-ui/icons/Work';
import DescriptionIcon from '@material-ui/icons/Description';
import axios from 'axios';
import ActionTypes from '../../dataModel/actionTypes';
import fireAction from '../../dataModel/fireAction';
import GoogleMaps from '../googleMap/googleMap';
const inputStyle = {
    root: {
        display: 'flex'
    }
}
const logInButtonStyle = {
    root: {
        marginTop: '1em',
    }
}
const registerButtonStyle = {
    root: {
        marginTop: '1em',
        marginInlineStart: '1em'
    }
}
const tyStyle = {
    root: {
        margin: '1em',
        color: 'red',
    }
}
const textInputStyle = {
    root: {
        marginInlineStart: '1em',
        marginInlineEnd: '1em',
    }
}

function LogIn(props) {
    const [logIn, setLogIn] = useState(true);
    const [err,setErr]=useState(false);
    const [errInfo,setErrInfo]=useState(null);
    const [errPassInfo, setErrPassInfo] = useState(null);
    const [errPass,setErrPass]=useState(false);
    // state for input
    

    const [logInName, setLogInName]=useState(null);
    const [temPassword,setTemPassword]=useState(null);
    const [password,setPassword]=useState(null);
    const [firstName,setFistname]=useState(null);
    const [lastName,setLastName]=useState(null);
    const [location,setLocation]=useState(null);
    const [occupation,setOccupation]=useState(null);
    const [description,setDescription]=useState(null);

    useEffect(()=>{
        setLogInName(null);
        setPassword(null);

    },[logIn])

    
    return (
        <Grid container direction='row' justify='center' alignItems='center' className="LIlogInTopContainer">
            {
                logIn ? <Grid container item md={6} direction="column" justify="flex-start" alignItems='center' className="LIloginContainer">
                    <Typography variant='h3'>Log In</Typography>
                    <form className="LIlogInForm" onSubmit={logInSubmitHandler}>
                        {err && <Typography style={tyStyle.root} varian='h5'>{errInfo}</Typography>}
                        <TextField autoFocus required label="Login Name" margin='normal' style={inputStyle.root} onInput={(e)=>{setErr(false);setErrInfo(false);setLogInName(e.target.value)}}/>
                        <TextField required label="Password" type='password' margin='normal' style={inputStyle.root} onInput={(e)=>{setErr(false);setErrInfo(false);setPassword(e.target.value)}}/>
                        <Button type='submit' size='medium' variant='outlined' style={logInButtonStyle.root}>Submit</Button>
                    </form>
                    <Typography variant='body1' style={tyStyle.root} onClick={() => setLogIn(false)}><u>Register</u></Typography>
                </Grid>
                    : <Grid container item md={12} direction="column" justify="flex-start" alignItems='flex-start' className="LIloginContainer">
                        <Typography variant='h3'>Register</Typography>
                        {err && <Typography style={tyStyle.root} varian='h5'>{errInfo}</Typography>}
                        <form onSubmit={registerSubmitHandler}>
                            <div className="LIformGrouper">
                                <TextField required label="Login Name" defaultValue='Login Name' margin='normal' variant='outlined' style={textInputStyle.root} InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AccountCircleIcon />
                                        </InputAdornment>
                                    ),
                                }} onFocus={((e)=>{e.target.value=""})} onInput={(e)=>{setLogInName(e.target.value)}}/>
                                <TextField required label="Password" margin='normal' variant='outlined' type='password' style={textInputStyle.root} InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <VpnKeyIcon />
                                        </InputAdornment>
                                    ),
                                }} onBlur={(e)=>{setTemPassword(e.target.value)}}/>
                                <TextField key={temPassword} required error={errPass} helperText={errPassInfo} label="Comfirm Password" margin='normal' variant='outlined' type='password' style={textInputStyle.root} InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <VpnKeyIcon />
                                        </InputAdornment>
                                    ),
                                }} onBlur={(e)=>{if(e.target.value){
                                    if(temPassword){
                                        if(temPassword!==e.target.value){
                                            setErrPass(true);
                                            setErrPassInfo("Different Input");
                                        }else{
                                            setErrPass(false);
                                            setErrPassInfo(null);
                                            setPassword(e.target.value)
                                        }

                                    }else{
                                        setErrPass(true);
                                        setErrPassInfo("No Input for Password");
                                    }}}} />
                            </div>
                            <div className="LIformGrouper">
                                <TextField required defaultValue="First Name" label="First Name" margin='normal' variant='outlined' style={textInputStyle.root} InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <FaceIcon />
                                        </InputAdornment>
                                    ),
                                }} onFocus={((e)=>{e.target.value=""})} onInput={(e)=>{setFistname(e.target.value)}}/>
                                <TextField required defaultValue="Last Name" label="Last Name" margin='normal' variant='outlined' style={textInputStyle.root} InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <FaceIcon />
                                        </InputAdornment>
                                    ),
                                }} onFocus={((e)=>{e.target.value=""})} onInput={(e)=>{setLastName(e.target.value)}}/>
                                <GoogleMaps value={location} setValue={setLocation} TextFieldProps={{InputProps:{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AddLocationIcon />
                                        </InputAdornment>
                                    ),
                                }}}/>                               
                                 {/*
                                <TextField defaultValue="Location" label="Location" margin='normal' variant='outlined' style={textInputStyle.root} InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AddLocationIcon />
                                        </InputAdornment>
                                    ),
                                }} onFocus={((e)=>{e.target.value=""})} onInput={(e)=>{setLocation(e.target.value)}}/>
                                */}
                                <TextField defaultValue="Occupation" label="Occupation" margin='normal' variant='outlined' style={textInputStyle.root} InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <WorkIcon />
                                        </InputAdornment>
                                    ),
                                }} onFocus={((e)=>{e.target.value=""})} onInput={(e)=>{setOccupation(e.target.value)}}/>
                                <TextField defaultValue="Description" label="Description" fullWidth margin='normal' multiline rowsMax={5} variant='outlined' style={textInputStyle.root} InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <DescriptionIcon />
                                        </InputAdornment>
                                    ),
                                }} onInput={(e)=>{setDescription(e.target.value)}}/>
                            </div>
                            <Button size='medium' variant='outlined' type='submit' style={registerButtonStyle.root}>Submit</Button>

                        </form>
                        <Typography variant='body1' style={tyStyle.root} onClick={() => setLogIn(true)}><u>Back to Login</u></Typography>
                    </Grid>
            }

        </Grid>
    )
    function logInSubmitHandler(e){
        e.preventDefault();
        let result={};
        if(!logInName){
            setErr(true);
            setErrInfo("Input Login Name");
            return;
        }
        result.login_name=logInName;
        if(!password){
            setErr(true);
            setErrInfo("Input Password");
            return;
        }
        result.password=password;
        //console.log(result);
        axios({
            method:'post',
            url:'/admin/login',
            data:result,
        }).then(response=>{
            if(response.status!==200){
                setErr(true);
                setErrInfo(response.data);
            }else{
                setErr(false);
                setErrInfo(null);
                props.setAppLogged(true);
                fireAction(ActionTypes.LOG_IN,response.data)
            }
        }).catch((e)=>{setErr(true);
            if(e.response){
                //console.log(e.response);
                setErrInfo(e.response.data)
            }else{
                setErrInfo(e.toString())
            }
            ;})

    }
    function registerSubmitHandler(e){
        e.preventDefault();
        let result={};
        if(!logInName){
            setErr(true);
            setErrInfo("Input Login Name");
            return;
        }
        result.login_name=logInName;
      
        if(!password){
            setErr(true);
            setErrInfo("Input Password");
            return;
        }
        result.password=password;
        if(!firstName){
            setErr(true);
            setErrInfo("Input First Name");
            return;
        }
        result.first_name=firstName;
        if(!lastName){
            setErr(true);
            setErrInfo("Input Last Name");
            return;
        }
        result.last_name=lastName;
        result.location=location?location.description:"";
        result.occupation=occupation?occupation:"";
        result.description=description?description:"";

        console.log(result);
        axios({
            method:'post',
            url:'/user/',
            data:result
        }).then(response=>{
            if(response.status===200){
                props.setAppLogged(true);
                fireAction(ActionTypes.LOG_IN,response.data);
                fireAction(ActionTypes.ADD_USERS,[response.data]);
                
            }else{
                setErr(true);
                setErrInfo(response.statusText);
              }
            }).catch((e)=>{setErr(true);setErrInfo(e.toString())});
    
    
    }


}

export default LogIn;