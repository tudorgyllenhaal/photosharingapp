const crypto=require('crypto');
//const { model, modelNames } = require('mongoose');
function makePasswordEntry(clearTextPassword){
    //console.log(clear)
    let salt=crypto.randomBytes(8);
    let total=Buffer.concat([Buffer.from(clearTextPassword,'base64'),salt])
    const hash=crypto.createHash('sha1');
    hash.update(total);
    return {salt:salt.toString('hex'),hash:hash.digest('hex')}
}

function doesPasswordMatch(hash, salt, clearTextPassword) {
    salt=Buffer.from(salt,'hex');
    let total=Buffer.concat([Buffer.from(clearTextPassword,'base64'),salt])
    const hashEngine=crypto.createHash('sha1');
    hashEngine.update(total);
    result=hashEngine.digest('hex');
    return result===hash;

}
module.exports.makePasswordEntry=makePasswordEntry;
module.exports.doesPasswordMatch=doesPasswordMatch;