import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    Button, Select, MenuItem, Stepper, Step, StepLabel, Typography, Snackbar, IconButton, Tooltip, TextField, InputAdornment,
    Chip, Grid,
    InputLabel,
    FormControl,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import CancelIcon from '@material-ui/icons/Cancel';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
//import dataContex from '../../dataModel/dataContext'
import briefuserstore from '../../dataModel/briefUserList';
import './addPhotoView.css';
//import photostore from '../../dataModel/photoList';
import fireAction from '../../dataModel/fireAction';
import ActionTypes from '../../dataModel/actionTypes'

import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import CloseIcon from '@material-ui/icons/Close';
import PhotoIcon from '@material-ui/icons/Photo';
//import FaceIcon from '@material-ui/icons/Face';

const inputRef = {
    root: {
        display: 'none',
    }
}
const useStyles = makeStyles({
    select: {
        padding: '10px 12px 10px',
        boxShadow: '0 3px 5px 2px rgb(33 32 32 / 30%)',
    },
    popper: {
        zIndex: '1900'
    },
    tooltip: {
        fontSize: 'medium'

    }
});
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
function getStyles(name, personName) {
    let unchecked = personName.filter(person => person.id === name.id).length === 0
    return {
        fontWeight:
            unchecked
                ? '400'
                : '700',
        backgroundColor:
            unchecked
                ? 'white'
                : '#adade0'
    };
}
function captureVisibility(capture, level = 1) {
    if (level === 0) {
        return {
            backgroundColor: capture ? 'transparent' : 'white'
        }
    } else {
        return {
            visibility: capture ? 'hidden' : 'visible',
        }
    }
}
function chipLabel(userList) {
    console.log("DEBUG", userList.length);
    if (userList.length === 1) {
        console.log("DEBUG", userList.name)
        return userList[0].name;
    } else if (userList.length > 1) {
        console.log("DEBUG", userList.name + " & " + userList.length + " others")
        return userList[0].name + " & " + (userList.length - 1) + " others";
    }

}
const steps = ['Upload a Photo', 'Tag Users', 'Set Visibility', 'Submit'];
const descriptions = ['Choose a Photo to Upload',
    'Tag Usrs in this Photo',
    'Choose Visibility of this Photo (Default Only Me)',
    'Submit'];
const captureSteps = ['Choose Region in the Photo', 'Tag People', 'Finish'];
const captureDescription = ['Press Shift to Start Capture Mode', 'Choose People in This Region', 'Finish Capture'];
function AddPhotoView(props) {

    //const cs142models = useContext(dataContex);
    const [uploadInput, setUploadInput] = useState(null);
    const [imgRef, setimgRef] = useState(null);
    const [captureRef, setCaptureRef] = useState(null);

    const [fileName, setFileName] = useState(null);
    const [preview, setPreview] = useState(null);

    const [visiableList, setVisiableList] = useState([]);
    const [uploadStage, setUploadStage] = useState(0);

    const [err, setErr] = useState(null);
    const [feedbackStatus, setFeedBackStatus] = useState(null);

    const [capture, setCapture] = useState(false);
    const [captureMode, setCaptureMode] = useState(false);
    const [captureStage, setCaptureStage] = useState(0);
    const [tagList, setTagList] = useState([]);
    const [captureWindow, setCaptureWindow] = useState(null);
    const [captureWindowProcessed, setCaptureWindowProcessed] = useState(null);
    let [tagOverallList, setTagOverallList] = useState([]);

    const classes = useStyles();

    useEffect(() => {
        //console.log('Fired 9')
        if (uploadInput) {
            if (fileName) {
                setFeedBackStatus(null);
                setErr(null);
            }
            //console.log(fileName, 'Click');
            const FR = new FileReader();
            FR.readAsDataURL(uploadInput.files[0]);
            FR.onload = (e) => { setPreview(e.target.result) }
        }
    }, [fileName])
    useEffect(() => {
        //console.log('Fired 10')
        if (uploadInput) {
            //console.log('[DEBUG] effect', uploadInput)
            if (capture && captureStage === 0) {
                document.addEventListener('keydown', handleKeyDown);
                console.log("ADD");

            } else {
                document.removeEventListener('keydown', handleKeyDown);
                console.log("REMOVE")
            }
        }
        return () => { if (uploadInput) { document.removeEventListener('keydown', handleKeyDown) } };
    }, [capture, captureStage, uploadInput])

    const userList = briefuserstore.getList();

    function onChange(e) {
        //console.log('Fired 11')
        //console.log(e.target.value)
        if (e.target.value.length === 1) {
            setVisiableList(e.target.value);
            return;
        }
        if (e.target.value[e.target.value.length - 1].id === 'All') {
            if (e.target.value[0].id === 'All') {
                setVisiableList([]);
            } else {
                setVisiableList([{ id: 'All', name: 'All' }]);

            }
            return
        } else {
            if (e.target.value.length === 2 && e.target.value[0].id === 'All') {
                setVisiableList([e.target.value[1]]);
                return;
            } else {
                for (let i = 0; i < e.target.value.length - 1; i++) {
                    let user = e.target.value[i]
                    if (user.id === e.target.value[e.target.value.length - 1].id) {
                        e.target.value.pop();
                        e.target.value.splice(i, 1);
                        setVisiableList([...e.target.value]);
                        return;


                    }
                }
                setVisiableList(e.target.value)
            }
        }
    }
    function onTagListChange(e) {
        if (e.target.value.length === 1) {
            setTagList(e.target.value);
        } else {
            //let newList=[];
            if (e.target.value.length >= 6) {
                e.target.value = e.target.value.slice(0, 5);
                setTagList(e.target.value);
                setErr("Five People At Most");
                setFeedBackStatus('error');
                return;
            }
            let newItem = e.target.value[e.target.value.length - 1];
            for (let index = 0; index < e.target.value.length - 1; index++) {
                let item = e.target.value[index];
                if (item.id === newItem.id) {
                    e.target.value.pop();
                    e.target.value.splice(index, 1);
                    setTagList([...e.target.value]);
                    return;
                }
            }
            setTagList(e.target.value);

        }

    }
    return (
        <div>
            <div className='APVbackground'>

            </div>
            <div className='APVtopContainer'>
                <div style={captureVisibility(captureMode)} className='APVcontrolContainer'>
                    <CancelIcon fontSize='large' color='primary' onClick={() => props.setAddPhotoView(false)} />
                </div>
                <div style={captureVisibility(captureMode, 0)} className="APVmediaContainer">
                    <div style={captureVisibility(captureMode)}>
                        {capture ? <Stepper activeStep={captureStage}>
                            {
                                captureSteps.map((label, index) => {
                                    const stepProps = {};
                                    if (index < captureStage) {
                                        stepProps.completed = true;
                                    }
                                    return (
                                        <Step key={label} {...stepProps}>
                                            <StepLabel>{label}</StepLabel>
                                        </Step>
                                    )
                                })
                            }
                        </Stepper> :
                            <Stepper activeStep={uploadStage}>
                                {steps.map((label, index) => {
                                    const stepProps = {};
                                    if (index < uploadStage) {
                                        stepProps.completed = true;
                                    }
                                    return (
                                        <Step key={label} {...stepProps}>
                                            <StepLabel>{label}</StepLabel>
                                        </Step>
                                    )

                                })}
                            </Stepper>
                        }

                        {capture ? <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 1em 0 1em' }}>
                            <Typography component='span' style={{ paddingLeft: '24px', paddingRight: '24px' }} variant='body1'>{captureDescription[captureStage] + '...'}</Typography>
                            <Button style={{ padding: '0' }} color='secondary' onClick={() => {
                                setCapture(null);
                                setTagList([]);
                                setCaptureStage(0)
                            }}>Exit</Button>
                        </div>
                            : <Typography style={{ paddingLeft: '24px', paddingRight: '24px' }} variant='body1'>{descriptions[uploadStage] + '...'}</Typography>
                        }

                    </div>
                    <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center' }} open={Boolean(feedbackStatus)} autoHideDuration={6000}>
                        <Alert severity={feedbackStatus ? feedbackStatus : 'info'}
                            action={
                                <IconButton
                                    aria-label="close"
                                    color="inherit"
                                    size="small"
                                    className={classes.close}
                                    onClick={() => {
                                        if (feedbackStatus === 'success') {
                                            props.setAddPhotoView(false);
                                        } else {
                                            setErr(null);
                                            setFeedBackStatus(null);
                                        }
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>

                            }>{err}</Alert>
                    </Snackbar>
                    <Grid container style={{overflow:'scroll'}}>
                        <Grid item lg={6} md={8} sm={12}>
                            <div className="APVimgContainer">

                                {preview && <React.Fragment>
                                    <img src={preview} ref={(nodeRef) => setimgRef(nodeRef)} />
                                    {captureWindowProcessed &&
                                        <Tooltip classes={{ popper: classes.popper, tooltip: classes.tooltip }} arrow open={tagList.length !== 0} placement='top' title={tagList.reduce((a1, a2) => a1 + a2.name + ' ', "")}>

                                            <div style={getPosition(captureWindowProcessed)} className='APVImageTagWindow'></div>
                                        </Tooltip>

                                    }
                                </React.Fragment>
                                }

                            </div>
                        </Grid>
                        <Grid item lg={6} md={4} sm={12}>
                            <div className='APVGridFeedback'>
                                {!capture &&
                                    <div style={captureVisibility(captureMode)}>
                                        <FormControl>
                                            <TextField disabled label="File Name" value={fileName ? fileName : ""} onChange={() => { }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PhotoIcon />
                                                        </InputAdornment>
                                                    ),
                                                }}>
                                            </TextField>
                                        </FormControl>
                                        <FormControl style={{ width: '100%' }}>
                                            <InputLabel>Tags</InputLabel>
                                            <Select multiple open={false}
                                                value={tagOverallList} onChange={() => { }}
                                                renderValue={(list) => (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                                        {list.map((tag) =>
                                                            <Chip key={tag.id}
                                                                label={chipLabel(tag.user_list)}
                                                                onDelete={() => handleTagDelete(tag.id)} />
                                                        )}
                                                    </div>
                                                )}
                                            >   {tagOverallList.length !== 0 &&
                                                    tagOverallList.map(tag =>
                                                        <MenuItem key={tag.id} value={tag}>{tag.id}</MenuItem>)
                                                }

                                            </Select>
                                        </FormControl>
                                        <FormControl style={{ width: '100%' }}>
                                            <InputLabel>Visibility</InputLabel>
                                            <Select multiple open={false}
                                                value={visiableList} onChange={() => { }}
                                                renderValue={(list) => (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                                        {list.map((user) =>
                                                            <Chip key={user.id}
                                                                label={user.name}
                                                                onDelete={() => handleVisibilityDelete(user.id)} />
                                                        )}
                                                    </div>
                                                )}
                                            >
                                                {visiableList.length !== 0 &&
                                                    visiableList.map(user =>
                                                        <MenuItem key={user.id} value={user}>{user.id}</MenuItem>)
                                                }
                                            </Select>
                                        </FormControl>

                                    </div>
                                }
                            </div>

                        </Grid>
                    </Grid>

                    {capture && captureStage === 0 && captureMode &&
                        <div className='APVCatch' id='APVCatch' ref={(nodeRef => setCaptureRef(nodeRef))}
                            onMouseDown={hanldeCatchMouseDown}
                            onMouseMove={handleCatchMouseMove}
                            onMouseUp={handleCatchMouseUp}
                        ></div>
                    }
                    <input type='file' label="Choose File" accept="image/*" style={inputRef.root} ref={(domFileRef) => { setUploadInput(domFileRef); }}
                        onChange={(e) => { if (e.target.files.length > 0) { setFileName(e.target.files[0].name) } }} />
                    <div style={captureVisibility(captureMode)} className="APVbuttonContainer">
                        <Button variant='contained' color='primary' disabled={uploadStage === 0 || capture && captureStage === 0} startIcon={<ArrowBackIcon />}
                            onClick={handleBack}>Back</Button>
                        {capture ? <div>
                            {<div>
                                {captureStage === 0 && <div>
                                    <Button variant='contained' color='secondary' onClick={() => { setCaptureWindowProcessed(null); setTagList([]); }}>Undo</Button>
                                </div>
                                }
                                {captureStage === 1 &&
                                    <Select classes={{ select: classes.select }} MenuProps={{ style: { zIndex: '1900' } }} variant="filled" label="Visibility" value={tagList} multiple
                                        displayEmpty
                                        renderValue={(selected) => {
                                            //console.log("DEBUG", selected)
                                            if (!selected.length || selected.length === 0) {
                                                return <em>Choose People</em>
                                            }
                                            let str = selected[0].name;
                                            if (selected.length > 1) {
                                                str += "..."
                                            }
                                            return <em>{str}</em>


                                        }} onOpen={() => { setErr(null); setFeedBackStatus(null); }}
                                        onChange={onTagListChange}>
                                        {userList.length !== 0 &&
                                            userList.map(user =>
                                                <MenuItem key={user._id} value={{ id: user._id, name: user.first_name + " " + user.last_name }} style={getStyles({ id: user._id, name: user.first_name + " " + user.last_name }, tagList)}>{user.first_name + " " + user.last_name}</MenuItem>)
                                        }

                                    </Select>
                                }
                                {captureStage === 2 && <Button variant='contained' color='secondary'
                                    onClick={() => {
                                        let tem = {};
                                        if (!captureWindowProcessed) {
                                            setErr("Area is Invalid");
                                            setFeedBackStatus('error');
                                            return;
                                        }
                                        tem.window = captureWindowProcessed;
                                        if (tagList.length === 0) {
                                            setErr("Tagged Users is Invalid");
                                            setFeedBackStatus('error');
                                            return;
                                        }
                                        tem.user_list = tagList;
                                        tem.id = Date.now();
                                        tagOverallList.push(tem);
                                        setTagOverallList(tagOverallList);
                                        setCaptureWindowProcessed(null);
                                        setTagList([]);
                                        setCapture(false);
                                        setCaptureStage(0);
                                    }}
                                >Finish</Button>}
                            </div>}
                        </div>
                            : <div>
                                {uploadStage === 0 &&
                                    <div>
                                        <Button label='Choose File' variant='contained' color='secondary' onClick={uploadFileHandler}>Choose Files</Button>
                                    </div>
                                }
                                {uploadStage === 1 && <div>
                                    <Button label='Start Capture' variant='contained' color='secondary' onClick={() => {
                                        if (tagOverallList >= 10) {
                                            tagOverallList = tagOverallList.slice(0, 10);
                                            setErr('At Most 10 Tags');
                                            setFeedBackStatus('error');
                                            return;
                                        }
                                        setCapture(true)
                                    }}>Start Capture</Button>
                                </div>
                                }
                                {uploadStage === 2 &&
                                    <Select classes={{ select: classes.select }} MenuProps={{ style: { zIndex: '1900' } }} variant="filled" label="Visibility" value={visiableList} multiple
                                        displayEmpty
                                        renderValue={(selected) => {
                                            //console.log("DEBUG", selected)
                                            if (!selected.length || selected.length === 0) {
                                                return <em>Choose Visibility</em>
                                            } else if (selected.length === 1) {
                                                if (selected[0].id === "All") {
                                                    return <em>All</em>
                                                }
                                            }
                                            let str = selected[0].name;
                                            if (selected.length > 1) {
                                                str += "..."
                                            }
                                            return <em>{str}</em>


                                        }}
                                        onChange={onChange} >
                                        <MenuItem key="All" value={{ id: "All", name: "All" }} style={getStyles({ id: "All", name: "All" }, visiableList)}>All</MenuItem>

                                        {userList.length !== 0 &&
                                            userList.map(user =>
                                                <MenuItem key={user._id} value={{ id: user._id, name: user.first_name + " " + user.last_name }} style={getStyles({ id: user._id, name: user.first_name + " " + user.last_name }, visiableList)}>{user.first_name + " " + user.last_name}</MenuItem>)
                                        }

                                    </Select>
                                }
                                {uploadStage === 3 &&
                                    <div>
                                        <Button color='secondary' label="Submit" variant='contained' onClick={submitHandler}>Submit</Button>

                                    </div>
                                }

                            </div>
                        }
                        <Button variant='contained' disabled={uploadStage >= 3 || capture && captureStage >= 2} color='primary' endIcon={<ArrowForwardIcon />}
                            onClick={handleNext}>Next</Button>

                    </div>

                </div>
            </div>
        </div>
    )
    function uploadFileHandler() {
        //console.log('Fired 1')
        //setErr(null);
        if (uploadInput) {
            //console.log("Click");
            uploadInput.click();
            //console.log("Clcik Two")
        } else {
            console.log("InValid Reference")
        }


    }
    function submitHandler() {
        //console.log('Fired 2')
        //console.log('[DEGUE1]')
        if (uploadInput && uploadInput.files.length > 0) {
            //console.log("[DEBUG]")
            const domForm = new FormData();
            domForm.append('uploadedphoto', uploadInput.files[0]);


            let visibilityListToSend = visiableList.map(obj => obj.id);
            visibilityListToSend = visibilityListToSend.length === 0 ? ['Me'] : visibilityListToSend;
            let tagListToSend = tagOverallList.map(tag => {
                let tem = {};
                tem.window = tag.window;
                tem.user_list = tag.user_list.map(user => user.id);
                return tem
            })
            axios.post('/photos/new', domForm)
                .then((res) => {
                    let photo_id = res.data._id;
                    // send to set visibility
                    //console.log("DataTOSEND", listToSend);
                    axios.post('/photos/control/' + photo_id, { visibility_list: visibilityListToSend, tag_list: tagListToSend }).then((feedback) => {
                        res.data.tag_list=tagListToSend;
                        delete res.data.visibility_list;
                        fireAction(ActionTypes.ADD_PHOTOS, [res.data]);
                        setErr('Succeed!');
                        setFeedBackStatus('success');
                    }).catch((e) => {
                        setErr(e.toString());
                        setFeedBackStatus('error');
                        res.data.visibility_list = ['Me'];
                        fireAction(ActionTypes.ADD_PHOTOS, [res.data]);
                        throw (e)
                    })
                })
                .catch(err => {
                    //console.log('[DEBUG] Wrong2')
                    setErr(err.toString());
                    setFeedBackStatus('error');
                })

        } else {
            setErr("Choose A File");
        }
    }
    function handleBack() {
        //console.log('Fired 3')
        if (capture) {
            let nextStage = captureStage - 1;
            nextStage = nextStage < 0 ? 0 : nextStage;
            setCaptureStage(nextStage);
        } else {

            let nextStage = uploadStage - 1;
            nextStage = nextStage < 0 ? 0 : nextStage;
            setUploadStage(nextStage);
        }


    }
    function handleNext() {
        //console.log('Fired 4')
        if (capture) {
            if (captureStage === 0 && !captureWindowProcessed) {
                setErr("Choose an Area in the Photo");
                setFeedBackStatus('error');
                return;
            }
            if (captureStage === 1 && tagList.length === 0) {
                setErr("Tag at Least One Person");
                setFeedBackStatus('error');
                return;
            }
            let nextStage = captureStage + 1;
            nextStage = nextStage > 2 ? 2 : nextStage;
            setCaptureStage(nextStage);
        } else {
            if (uploadStage === 0 && !fileName) {
                setErr("Choose A File");
                setFeedBackStatus("error")
                return;
            }
            let nextStage = uploadStage + 1;
            nextStage = nextStage > 3 ? 3 : nextStage;
            setUploadStage(nextStage);
        }
    }
    // Enter Capture Mode
    function handleKeyDown(e) {
        //console.log('Fired 5')
        if (e.which === 16) {
            setCaptureMode(true);
            setErr("Press Escape to Exit Capture Mode");
            setFeedBackStatus('info');
        } else if (e.which === 27) {
            setCaptureMode(false);
        } else {
            setErr(null);
            setFeedBackStatus(null);
        }
    }
    function hanldeCatchMouseDown(e) {
        //console.log('Fired 6')
        e.preventDefault();
        if (e.button === 0) {
            setCaptureWindow([e.clientX, e.clientY, e.clientX, e.clientY])

        }
    }
    function handleCatchMouseMove(e) {
        //console.log('Fired 7')
        e.preventDefault();
        if (captureWindow) {
            let currentX = e.clientX;
            let currentY = e.clientY;
            let newWindow = captureWindow;
            if (currentX <= newWindow[0]) {
                newWindow[0] = currentX;
            } else {
                newWindow[2] = currentX;
            }
            if (currentY <= newWindow[1]) {
                newWindow[1] = currentY;
            } else {
                newWindow[3] = currentY;
            }
            setCaptureWindow(newWindow);
            let temDiv = React.createElement('div', {
                style: {
                    left: newWindow[0],
                    top: newWindow[1],
                    width: newWindow[2] - newWindow[0],
                    height: newWindow[3] - newWindow[1]
                }
                , className: 'APVCaptureRec'
            })
            ReactDOM.render(temDiv, document.getElementById('APVCatch'))



        }

        //let temDiv=React.createElement('div',{style:{},className:'APVCaptureWindow'})

    }
    function handleCatchMouseUp(e) {
        //console.log('Fired 8')
        if (captureWindow) {
            if (!imgRef) {
                throw (new Error('Image Reference is InValid'));
            }
            let bound = imgRef.getClientRects()[0];
            let newWindow = captureWindow;
            //console.log('[DEBUG] BOUND',bound)
            newWindow[0] = newWindow[0] < bound.left ? bound.left : newWindow[0];
            newWindow[0] = newWindow[0] > bound.right ? bound.right : newWindow[0];
            newWindow[2] = newWindow[2] < bound.left ? bound.left : newWindow[2];
            newWindow[2] = newWindow[2] > bound.right ? bound.right : newWindow[2];
            newWindow[1] = newWindow[1] < bound.top ? bound.top : newWindow[1];
            newWindow[1] = newWindow[1] > bound.bottom ? bound.bottom : newWindow[1];
            newWindow[3] = newWindow[3] < bound.top ? bound.top : newWindow[3];
            newWindow[3] = newWindow[3] > bound.bottom ? bound.bottom : newWindow[3];
            //console.log("[DEBUG] TEM",newWindow);
            newWindow[0] = (newWindow[0] - bound.left) / (bound.right - bound.left);
            newWindow[1] = (newWindow[1] - bound.top) / (bound.bottom - bound.top);
            newWindow[2] = (newWindow[2] - bound.left) / (bound.right - bound.left);
            newWindow[3] = (newWindow[3] - bound.top) / (bound.bottom - bound.top);

            if (captureRef) {
                captureRef.innerHTML = '';
                setErr(null);
                setFeedBackStatus(null);
                setCaptureMode(false);
                setCaptureWindow(null);
                setCaptureWindowProcessed(newWindow);
            } else {
                throw (new Error("Invalid Capture Ref"))
            }

        }
    }
    function handleTagDelete(ID) {
        let index = tagOverallList.findIndex(item => item.id === ID);
        //console.log(index);
        if (index !== -1) {
            tagOverallList.splice(index, 1);
            setTagOverallList([...tagOverallList]);
        }

    }
    function handleVisibilityDelete(ID) {
        let index = visiableList.findIndex(user => user.id === ID);
        if (index !== -1) {
            visiableList.splice(index, 1);
            setVisiableList([...visiableList])
        }
    }

}


export default AddPhotoView;