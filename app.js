const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const favicon = require("serve-favicon");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/static", express.static(path.join(__dirname, "static")));

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/*", (req, res) => {
  res.render("index.jade");
});

app.post("/arranger", (req, res) => {
  res.render("arranger.jade");
});

app.post("/constructor", (req, res) => {
  res.render("constructor.jade");
});

app.post("/constructor/chords", (req, res) => {
  res.render("chordBuilder.jade");
});

app.post("/constructor/drums", (req, res) => {
  res.render("drumBuilder.jade");
});

app.post("/constructor/bass", (req, res) => {
  res.render("bassBuilder.jade");
});

app.post("/constructor/melo", (req, res) => {
  res.render("meloBuilder.jade");
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
