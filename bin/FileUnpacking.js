const mh = require("./MidiHandling");
const unzipper = require('unzipper');

async function Unzip(zipFile){
    let directory = await unzipper.Open.buffer(zipFile.buffer);

    let files = [];

    for(let i = 0; i < directory.files.length; i++){
        let path = directory.files[i].path.split('/');
        if(path.length === 3 && path[2].length > 0){
            files.push([path[2] === 'ch.mid' ? mh.ch : mh.kick, [...await directory.files[i].buffer()]]);

        }
    }
    return files;
}

module.exports = {Unzip};