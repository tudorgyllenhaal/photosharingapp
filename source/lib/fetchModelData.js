import axios from 'axios';
var Promise = require("Promise");
//var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

/**
  * FetchModel - Fetch a model from the web server.
  *     url - string - The URL to issue the GET request.
  * Returns: a Promise that should be filled
  * with the response of the GET request parsed
  * as a JSON object and returned in the property
  * named "data" of an object.
  * If the requests has an error the promise should be
  * rejected with an object contain the properties:
  *    status:  The HTTP response status
  *    statusText:  The statusText from the xhr request
  *
*/


function fetchModel(url) {
  return axios.get(url)
      .then((response)=>{
        if(response.status===200){
          //console.log(response.data[0]);
          return {data:response.data};
        }else{
          throw(new Error(response.status+response.statusText));
        }
      })
  /*
  return new Promise(function(resolve, reject) {
      let xhttp= new XMLHttpRequest();
      xhttp.onreadystatechange=function(){
        if(this.readyState===4){
          if(this.status===200){
            let response=JSON.parse(this.responseText)
            resolve({data:response})
          }else{
            reject({status:this.status,
                    statusText:this.statusText})
          }
        }
      }
      xhttp.open("GET",url);
      xhttp.send();
      
  
      //console.log(url);
      //setTimeout(() => reject({status: 501, statusText: "Not Implemented"}),0);
      // On Success return:
      // resolve({data: getResponseObject});
  });
  */
}
//fetchModel("http://localhost:3000/test/info").then((e)=>console.log(e)).catch((e)=>console.log(e));

export default fetchModel;
