const express = require("express");
const path = require("path");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");

const print = console.log;

const app = express();
const upload = multer();

const fu = require("./bin/FileUnpacking");
const mmm = require("./bin/MakeMidiModel");
const mh = require("./bin/MidiHandling");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/upload", upload.single("uploadFile"), async (req, res) => {
  try {
    if (!req.file) {
      print("no file uploaded");
      res.render("index", { title: "Midi Ting Fi Real" });
    } else {
      let sourceInfo = mh.ParseBatch(await fu.Unzip(req.file));
      let kickModel = mmm.GenerateModel(sourceInfo[mh.kick]);
      let chModel = mmm.GenerateModel(sourceInfo[mh.ch]);

      res.render("builder", {
        title: "Midi Ting Fi Real",
        chModel: JSON.stringify(chModel),
        kickModel: JSON.stringify(kickModel),
      });
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/", (req, res) => {
  res.render("index", { title: "Midi Ting Fi Real" });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
