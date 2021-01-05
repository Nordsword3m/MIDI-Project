const mh = require("./MidiHandling");
const fu = require("./FileUnpacking");
const fs = require("fs");

fu.Unzip(
  fs.readFileSync(__dirname.slice(0, -3) + "upload_v2.zip")
  //fs.readFileSync(__dirname.slice(0, -3) + "tst.zip")
).then((res) =>
  fs.writeFileSync(
    __dirname.slice(0, -3) + "public\\sourceData.txt",
    JSON.stringify(mh.ParseBatch(res))
  )
);
