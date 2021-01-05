const mh = require("./MidiHandling");
const unzipper = require("unzipper");

async function Unzip(zipFile) {
  let directory = await unzipper.Open.buffer(zipFile);

  let files = [];

  for (let i = 0; i < directory.files.length; i++) {
    // For each file in the zip
    let path = directory.files[i].path.split("/"); // Get the path as an array
    if (path.length === 3 && path[2].length > 0) {
      // If the file object is 2 levels deep aka one of the file we want

      files.push([
        path[1] === "ch" ? mh.ch : mh.kick,
        [...(await directory.files[i].buffer())],
        directory.files[i].path,
      ]); // Push a file and its type onto an array
    }
  }
  return files;
}

module.exports = { Unzip };
