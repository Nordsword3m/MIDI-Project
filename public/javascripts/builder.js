const getById = function (id) {
  return document.getElementById(id);
};

const getByClass = function (classname) {
  return document.getElementsByClassName(classname);
};

// Page Elements
let display = null;
let divisionDisplay = null;
let hihatDisplay = null;
let snareDisplay = null;
let percDisplay = null;

let complexitySlider = null;
let ancestralSlider = null;

let snarePattern = null;

let percOptn1Bars = null;
let percOptn2Bars = null;

let playHead = null;
let tempoInfo = null;
let notes = null;

const numOfDivs = 32;

// Play position tracking
let prevPlayTime;
let playPos = 0;
let relPlayPos = 0;

let playTimerID; // Keeps track of the "Playing" routine
let playStart = 0;

let playing = false;

let nextChunk = 0;
let relNextChunk = 0;

const chunkSize = barLength;

// Note calculation processing
let chNoteArr = null;
let snrNoteArr = null;
let percNoteArr = null;

let chModel = null;

// Index ids
const ch = 0;
const snr = 1;
const kik = 2;
const perc = 3;

//State variables
let metroActive = false;

let am = new AudioManager(["m1", "m2", "ch", "snr", "perc"]);
let nm = new NoteManager();
let dem = new DisplayElementManager();

// PLAY PROCESSING-------------------------------------------------------------------------
function Playing() {
  // Playing routine, run as frequently as possible
  let timeDelta = am.context.currentTime - prevPlayTime;
  prevPlayTime = am.context.currentTime;
  let trackLength = (60.0 / tempoInfo.value) * 32;

  setPlayPos(playPos + timeDelta / trackLength);

  if (playPos >= nextChunk) {
    NextChunk();
  }

  SetHeadPos();
}

async function TogglePlaying(pos, play) {
  if (play !== playing) {
    getById("playButton").classList.toggle("fa-pause");
    getById("playButton").classList.toggle("fa-play");
    playing = play;
  }

  am.ClearContext();

  if (play) {
    await am.NewContext();
    prevPlayTime = am.context.currentTime;
    playStart = am.context.currentTime;
    clearInterval(playTimerID);
    playTimerID = setInterval(Playing, 1);

    setNextChunk(Math.floor((1 / chunkSize) * pos) * chunkSize);
    setPlayPos(nextChunk);
    NextChunk();
  } else {
    clearInterval(playTimerID);
    setPlayPos(0);
    setNextChunk(0);
  }

  SetHeadPos();
}

function setPlayPos(pos) {
  playPos = pos;
  relPlayPos = playPos % 1;
}

function SetHeadPos() {
  playHead.style.left = relPlayPos * (display.offsetWidth - 1) + "px";
}

// CHUNK MANAGEMENT-----------------------------------------------------------------
function NextChunk() {
  scheduleMets();
  scheduleNotes();

  setNextChunk(nextChunk + chunkSize);
}

function setNextChunk(chunk) {
  nextChunk = chunk;
  relNextChunk = nextChunk % 1;
}

// AUDIO PROCESSING------------------------------------------------------------
function playSound(name, pos) {
  am.play(name, pos, relPlayPos, tempoInfo.value);
}

// NOTE PLAYING-------------------------------------------------------------------------
function scheduleNotes() {
  for (let i = 0; i < chunkSize * 256; i++) {
    const step = relNextChunk * 256 + i;

    if (chNoteArr[step] > 0) {
      playSound("ch", step * stepLength);
    }

    if (snrNoteArr[step] > 0) {
      playSound("snr", step * stepLength);
    }

    if (percNoteArr[step] > 0) {
      playSound("perc", step * stepLength);
    }
  }
}

// METRONOME-----------------------------------------------------------------------------
function scheduleMets() {
  if (metroActive) {
    for (let i = 0; i < chunkSize * 256; i++) {
      const step = relNextChunk * 256 + i;

      if ((step / (256 * noteLength)) % 1 === 0) {
        if ((step / (256 * barLength)) % 1 === 0) {
          playSound("m1", step * stepLength);
        } else {
          playSound("m2", step * stepLength);
        }
      }
    }
  }
}

function toggleMetronome(elem) {
  elem.classList.toggle("iconOff");
  metroActive = !metroActive;
}

// SETUP AND WINDOW STUFF-----------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  display = getById("display");
  divisionDisplay = getById("divDisp");
  hihatDisplay = getById("hihatDisp");
  snareDisplay = getById("snareDisp");
  percDisplay = getById("percDisp");

  playHead = getById("playHead");

  complexitySlider = getById("complexity");
  ancestralSlider = getById("ancestral");
  snarePattern = getById("snarePatternSelect");
  percOptn1Bars = getByClass("perc1Bar");
  percOptn2Bars = getByClass("perc2Bar");

  tempoInfo = getById("tempoInput");

  display.addEventListener("click", function (event) {
    TogglePlaying(
      (event.pageX - display.offsetLeft) / display.offsetWidth,
      true
    ).then();
  });

  getById("playButton").addEventListener("click", function () {
    TogglePlaying(0, !playing).then();
  });

  chModel = JSON.parse(getById("chModel").innerHTML);

  notes = dem.InitialiseNotes();
  dem.CreateDivisions();

  ShowNotes();

  let optns = document.getElementsByClassName("configOption");
  for (let i = 0; i < optns.length; i++) {
    optns[i].addEventListener("input", () => ShowNotes());
  }
});

function ShowNotes() {
  let perc1Bars = [];
  let perc2Bars = [];

  for (let i = 0; i < 8; i++) {
    perc1Bars.push(percOptn1Bars[i].checked);
    perc2Bars.push(percOptn2Bars[i].checked);
  }

  chNoteArr = nm.CalculateCh();
  snrNoteArr = nm.CalculateSnare(snarePattern.value);
  percNoteArr = nm.CalculatePerc(perc1Bars, perc2Bars);
  dem.Display(chNoteArr, notes[ch]);
  dem.Display(snrNoteArr, notes[snr]);
  dem.Display(percNoteArr, notes[perc]);
}
