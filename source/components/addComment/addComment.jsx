import React, { useState, useEffect, useContext } from 'react';
import {
    ListItem, TextField, InputAdornment, List, Popper, Divider,

} from '@material-ui/core';
//import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';

import './addComment.css';
import dataContext from "../../dataModel/dataContext";

import axios from 'axios';

import AddCommentIcon from '@material-ui/icons/AddComment';
import fetchModel from '../../lib/fetchModelData';
import ActionTypes from '../../dataModel/actionTypes';
import fireAction from '../../dataModel/fireAction';
import userbrieflist from '../../dataModel/briefUserList';
import briefuserstore from '../../dataModel/briefUserList';

const style = {
    backgroundColor: 'rgba(255,255,255,1.00)',
    borderBottomLeftRadius: '5px',
    borderTopLeftRadius: '5px',
    borderBottomRightRadius: '5px',
    borderTopRightRadius: '5px',
    boxShadow: 'rgba(101, 119, 134, 0.2) 0px 0px 15px, rgba(101, 119, 134, 0.15) 0px 0px 3px 1px'
}
const defaultValue = "Press Enter to Send";
const placeholder = {
    left: '<<({{',
    right: '}})>>',
}

function validPrintable(keycode) {
    return (keycode > 47 && keycode < 58) || // number keys
        keycode == 32 || // spacebar & return key(s) (if you want to allow carriage returns)
        (keycode > 64 && keycode < 91) || // letter keys
        (keycode > 95 && keycode < 112) || // numpad keys
        (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
        (keycode > 218 && keycode < 223);   // [\]' (in order)
}

function AddComment(props) {
    let cs142models = useContext(dataContext);
    const [anchorEI, setAnchorEI] = useState(null);
    const [defaultOptions, setDefaultOptions] = useState(briefuserstore.getList());
    const [selected, setSelected] = useState(null);
    const [options, setOptions] = useState(defaultOptions);
    let [tagList, setTagList] = useState([]);
    let [mentionList, setMentionList] = useState([]);

    const [text, setText] = useState("");


    const [err, setErr] = useState(false);
    const [helperText, setHelperText] = useState(defaultValue);

    let open = Boolean(anchorEI);

    //const [options,setOptions] =cs142models.userBriefList;

    const onCacheChange=()=>{
        setDefaultOptions(briefuserstore.getList())

    }
    useEffect(() => {
        briefuserstore.addChangeListener(onCacheChange);
        if (defaultOptions.length === 0) {
            fetchModel('/user/list').then(data => fireAction(ActionTypes.INIT_USERS, data.data));
        }
        return ()=>briefuserstore.removeChangeListener(onCacheChange);
    }, [])

    function resetSuggestion() { //used to reset suggestion state;
        setAnchorEI(null);
        setOptions([]);
        //setTagStart(null);
        setSelected(null);
    }
    function initializeSuggestion(e) {
        setAnchorEI(e.target);
        setOptions(defaultOptions);
        //setTagStart(e.target.selectionStart);
        setSelected(defaultOptions[0]._id);
    }
    function selectionValidation() {
        if (selected === null) {
            throw (new Error("Selected is Null"));
        }
        if (options.findIndex(option => option._id === selected) === -1) {
            throw (new Error("Selected is not in options"))
        }
        return true;
    }

    function optionsValidation(str) {
        if (options === null) {
            throw (new Error("Option is Null"));
        }
        str = str.toLowerCase()
        if (options.length !== options.filter(option => {
            let target = option.first_name + " " + option.last_name;
            target = target.toLowerCase();
            return target.search(str) !== -1
        }).length) {
            throw (new Error("Suggetions are Incorrect"))
        }
    }
    function adjustPosition(endIndex, length) {
        //let affectedMention=mentionList.filter(mention=>mention.start>=endIndex);
        let newMentionList = mentionList.map(mention => {
            return {
                start: mention.start >= endIndex ? mention.start + length : mention.start,
                end: mention.start >= endIndex ? mention.end + length : mention.end,
                ref: mention.ref,
            }
        })
        setMentionList(newMentionList);
        setTagList(tagList.map(tag => tag >= endIndex ? tag + length : tag))


    }
    function insertMention(obj) {
        let startIndex = obj.start;

        let index = mentionList.filter(mention => mention.end <= startIndex).length;
        mentionList.splice(index, 0, obj);
        setMentionList(mentionList);


    }
    function insertTag(tag) {
        let index = tagList.filter(item => item < tag).length;
        tagList.splice(index, 0, tag);
        setTagList(tagList);
    }
    function findTag(position, popout = true) {
        let len = tagList.filter(item => item < position).length;
        let index = len !== 0 ? tagList[len - 1] : -1;
        if (popout && len !== 0) { //delete this tag from tagList
            tagList.splice(len - 1, 1)
            setTagList(tagList);
        }
        return index;

    }
    function findMention(position, popout = true) {
        let len = mentionList.filter(mention => mention.start < position).length;
        let obj = len !== 0 ? mentionList[len - 1] : -1;
        if (popout && len !== 0) {
            mentionList.splice(len - 1, 1);
            setMentionList(mentionList);
        }
        return obj;

    }
    function findFormer(position) {
        let formerTag = findTag(position, false);
        let formerMention = findMention(position, false);
        if (formerTag === -1 && formerMention === -1) {
            return -1;
        } else if (formerTag === -1) {
            return formerMention;
        } else if (formerMention === -1) {
            return formerTag;
        } else {
            return formerTag >= formerMention.start ? formerTag : formerMention;
        }
    }
    function deleteCharacters(str, startIndex, endIndex, e) {
        e.preventDefault();
        let newStr;
        let deletedLen = endIndex - startIndex;

        let newMentionList = [];
        let newStartIndex = startIndex;
        let newEndIndex = endIndex;
        for (let mention of mentionList) {
            if (mention.end > startIndex && mention.start < endIndex) {
                if (startIndex > mention.start && startIndex <= mention.end) {
                    deletedLen += startIndex - mention.start
                    if (mention.start < newStartIndex) {
                        newStartIndex = mention.start;
                    }
                }
                if (endIndex > mention.start && endIndex <= mention.end) {
                    deletedLen += mention.end - endIndex + 1;
                    if (mention.end + 1 > newEndIndex) {
                        newEndIndex = mention.end;
                    }
                }

            } else {
                newMentionList.push(mention);
            }

        }

        mentionList = newMentionList;
        tagList = tagList.filter(tag => tag < newStartIndex || tag >= newEndIndex)
        setTagList(tagList);
        adjustPosition(newEndIndex, -deletedLen);
        newStr = str.slice(0, newStartIndex);
        newStr += str.slice(newEndIndex);
        setText(newStr);
        e.target.value = newStr;
        e.target.setSelectionRange(newStartIndex, newStartIndex);
    }


    function reCalSuggestion(e, newStr) {
        let newOptions = defaultOptions.filter(option => {
            let str = option.first_name + " " + option.last_name;
            str = str.toLowerCase();
            return str.search(newStr) !== -1
        })
        if (newOptions.length !== 0) {
            setAnchorEI(e.target);
            setOptions(newOptions);
            if (selected === null || (selected !== null && newOptions.filter(option => option._id === selected).length === 0)) {
                setSelected(newOptions[0]._id);
            }
            //setTagStart(newFormer);
            //findTag(former.start); // pop out tag;
        } else { // no matching
            resetSuggestion(); //turn off suggestion
        }

    }

    function onKeyDown(e, id) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            if (e.target.selectionStart !== e.target.selectionEnd) {//selection
                return;
            }
            if (e.target.selectionStart === e.target.value.length) { //submit comment
                if (selected === null) { // send 
                    //console.log("TRY TO SEND");
                    addCommentHandler(e, id);
                    return;
                }
            }
            let former = findFormer(e.target.selectionStart);
            if (former === -1 || former instanceof Object) {
                resetSuggestion();
                return;

            } else {
                if (selected === null) {// no selection
                    resetSuggestion()
                    return;
                }
                let str = e.target.value.slice(former + 1, e.target.selectionStart); //validate selection
                try {
                    optionsValidation(str);
                    selectionValidation();
                } catch (error) {
                    console.log(error.toString());
                    resetSuggestion();
                    return;
                }
                //console.log("Here I am")
                findTag(e.target.selectionStart);// pop out
                let newValue = e.target.value.slice(0, former);
                let selectedUser = options.filter(option => option._id === selected)[0];
                newValue += selectedUser.first_name + " " + selectedUser.last_name + " ";
                newValue += e.target.value.slice(e.target.selectionStart);
                adjustPosition(e.target.selectionStart, newValue.length - e.target.value.length);
                //console.log("Here I am")
                insertMention({
                    start: former,
                    end: former + selectedUser.first_name.length + selectedUser.last_name.length + 1,
                    ref: selectedUser
                });
                //e.target.value = newValue;
                setText(newValue);
                resetSuggestion();
            }
            // when there is suggestion, input suggestion.
            // at the end of input text and no suggestion, send comment

        } else if (e.key === '@') {
            if (e.target.selectionStart !== e.target.selectionEnd) {  //disable selection
                deleteCharacters(e.target.value, e.target.selectionStart, e.target.selectionEnd, e)
                //let newStr = e.target.value.slice(0, e.target.selectionStart);
                //newStr += e.key;
                //newStr += e.target.value.slice(e.target.selectionEnd);
                //e.target.value=newStr;
                //setText(newStr);
            }
            let newStr = e.target.value.slice(0, e.target.selectionStart);
            newStr += e.key;
            newStr += e.target.value.slice(e.target.selectionEnd);
            //e.target.value=newStr;
            setText(newStr);
            adjustPosition(e.target.selectionStart, 1);
            insertTag(e.target.selectionStart);
            initializeSuggestion(e);


        } else if (e.key === 'Backspace') {
            // delete element
            if (e.target.selectionStart !== e.target.selectionEnd) {
                deleteCharacters(e.target.value, e.target.selectionStart, e.target.selectionEnd, e);
            } else {
                deleteCharacters(e.target.value, e.target.selectionStart - 1, e.target.selectionStart, e);
            }
            let former = findFormer(e.target.selectionStart);

            if (former === -1 || former instanceof Object) {
                resetSuggestion();
            } else {
                let newStr = e.target.value.slice(former + 1, e.target.selectionStart);
                reCalSuggestion(e, newStr)

            }

        } else if (validPrintable(e.keyCode)) {
            if (e.target.selectionStart !== e.target.selectionEnd) {
                deleteCharacters(e.target.value, e.target.selectionStart, e.target.selectionEnd, e);
                //let newStr=e.target.value.slice(0,e.target.selectionStart);
                //newStr+=e.key;
                //newStr+=e.target.value.slice(e.target.selectionEnd);
                //e.target.value=newStr;
                //setText(newStr);
            }
            let newStr = e.target.value.slice(0, e.target.selectionStart);
            newStr += e.key;
            newStr += e.target.value.slice(e.target.selectionEnd);
            //e.target.value=newStr;
            setText(newStr);
            adjustPosition(e.target.selectionStart,1);
            let former = findFormer(e.target.selectionStart);
            if (former === -1 || former instanceof Object) {
                adjustPosition(e.target.selectionStart, 1);
                resetSuggestion();
                //adjustPosition(e.target.selectionStart, 1);
            } else {
                adjustPosition(e.target.selectionStart, 1);
                let newStr = e.target.value.slice(former + 1, e.target.selectionStart) + e.key;
                reCalSuggestion(e, newStr);
            }
        } else if (e.keyCode === 38) {
            e.preventDefault()
            if (anchorEI !== null) {
                let index = options.findIndex(option => option._id === selected);
                if (index === -1) {
                    console.log("[ERROR] Selected is invalid")
                } else {
                    index = index !== 0 ? index - 1 : options.length - 1;
                }
                setSelected(options[index]._id);
            }
        } else if (e.keyCode === 40) {
            e.preventDefault();
            if (anchorEI !== null) {
                let index = options.findIndex(option => option._id === selected);
                if (index === -1) {
                    console.log("[ERROR] Selected is invalid")
                } else {
                    index = index !== options.length - 1 ? index + 1 : 0;
                }
                setSelected(options[index]._id);
            }
        } else if (e.keyCode === 37 || e.keyCode === 39) {
            let former = findFormer(e.target.selectionStart);
            if (former === -1 || former instanceof Object) {
                resetSuggestion();
            } else {
                let newStr = e.target.value.slice(former + 1, e.target.selectionStart) + e.key;
                reCalSuggestion(e, newStr);
            }

        }
    }

    function addCommentHandler(e, id) {
        if (e.target.value) {
            let newStr = "";
            if (mentionList.length !== 0) {
                for (let i = 0; i < mentionList.length; i++) {
                    //console.log("Mention")
                    let mention = mentionList[i];
                    if (i === 0) {
                        newStr += e.target.value.slice(0, mention.start)
                    } else {
                        newStr += e.target.value.slice(mentionList[i - 1].end, mention.start);
                    }
                    if (e.target.value.slice(mention.start, mention.end) !== (mention.ref.first_name + " " + mention.ref.last_name)) {
                        setErr(true);
                        setHelperText("Mention Format Wrong");
                    } else {
                        //console.log("pass validation for ",i)
                        newStr = newStr + placeholder.left + mention.ref.login_name + "??" + mention.ref._id + placeholder.right;
                    }
                    if (i === mentionList.length - 1) {
                        newStr = newStr + e.target.value.slice(mention.end);
                    }
                }
            } else {
                newStr = e.target.value;
            }
            //console.log("comment",newStr)
            axios({
                method: 'post',
                url: '/commentsOfPhoto/' + id,
                data: { comment: newStr },
            }).then((response) => {
                if (response.status === 200) {
                    setErr(false);
                    setHelperText("Succeed!")
                    //e.target.value="";
                    setText("");
                    //console.log("FEEDBACK",response.data._id);
                    fireAction(ActionTypes.ADD_COMMENT, { photo_id: id, comment: response.data.comment });
                } else {
                    throw (new error(response.status))
                }
            }).catch(e => { setErr(true); setHelperText(e.toString()); console.log(e) })




        }
    }
    return (
        <div>
            <ListItem>

                <TextField multiline value={text} rowsMax={5} fullWidth label="Write a Comment" margin="normal"
                    //defaultValue={defaultValue}
                    error={err}
                    helperText={helperText}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <AddCommentIcon />
                            </InputAdornment>
                        ),
                    }} onKeyDown={(e) => { onKeyDown(e, props.photoId) }}
                    //onFocus={(e)=>{if(e.target.value===defaultValue){e.target.value=""}}}
                    //onBlur={(e) => setAnchorEI(null)}
                    //onChange={(e) => console.log("onchange" + e.target)}
                    onFocus={(e) => { setErr(false); setHelperText(defaultValue) }}
                />

                <Popper style={{ zIndex: "1900" }} autoFocus={false} anchorEl={anchorEI} open={open}>
                    <List style={style}>
                        {options.length > 0 &&
                            options.map((option) => {
                                return (<div key={option._id}>
                                    <ListItem selected={option._id === selected}>{option.first_name + " " + option.last_name}</ListItem><Divider /></div>)
                            })
                        }

                    </List>
                </Popper>
            </ListItem>

        </div>
    )
}
export default AddComment;