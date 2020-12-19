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
let kickDisplay = null;
let snareDisplay = null;
let percDisplay = null;

let chComplexitySlider = null;
let chAncestralSlider = null;

let kickComplexitySlider = null;
let kickAncestralSlider = null;

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
let loopStart = 0;

let playTimerID; // Keeps track of the "Playing" routine
let playStart = 0;

let playing = false;

let nextChunk = 0;
let relNextChunk = 0;
let chunkPreRender = 1 / 2;

const chunkSize = noteLength;

// Note calculation processing
let chNoteArr = null;
let kickNoteArr = null;
let snrNoteArr = null;
let percNoteArr = null;

let chModel = null;
let kickModel = null;

// Index ids
const ch = 0;
const snr = 1;
const kick = 2;
const perc = 3;

//State variables
let metroActive = false;

let am = new AudioManager(["m1", "m2", "ch", "snr", "perc", "kick"]);
let nm = new NoteManager();
let dem = new DisplayElementManager();

// PLAY PROCESSING-------------------------------------------------------------------------
function Playing() {
  // Playing routine, run as frequently as possible
  let timeDelta = am.curTime() - prevPlayTime;
  prevPlayTime = am.curTime();
  let trackLength = (60.0 / tempoInfo.value) * 32;

  setPlayPos(playPos + timeDelta / trackLength);

  if (playPos >= nextChunk - chunkSize * chunkPreRender) {
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
    prevPlayTime = am.curTime();

    setNextChunk(Math.floor((1 / chunkSize) * pos) * chunkSize);
    setPlayPos(nextChunk);
    setLoopStart();

    NextChunk();

    clearInterval(playTimerID);
    playTimerID = setInterval(Playing, 1);
  } else {
    clearInterval(playTimerID);
    setPlayPos(0);
    setNextChunk(0);
  }

  SetHeadPos();
}

function setLoopStart() {
  let trackLength = (60.0 / tempoInfo.value) * (256 * barLength);
  loopStart = am.curTime() - relPlayPos * trackLength;
}

function setPlayPos(pos) {
  let posDelta = pos - playPos;
  playPos = pos;
  relPlayPos += posDelta;

  //console.log(relPlayPos);

  if (relPlayPos >= 1) {
    while (relPlayPos >= 1) {
      relPlayPos--;
    }
    setLoopStart();
  } else if (relPlayPos < 0) {
    while (relPlayPos < 0) {
      relPlayPos++;
    }
  }
}

function SetHeadPos() {
  playHead.style.left = relPlayPos * (display.offsetWidth - 1) + "px";
}

// CHUNK MANAGEMENT-----------------------------------------------------------------
function NextChunk() {
  if (relPlayPos + chunkSize * chunkPreRender >= 1) {
    let trackLength = (60.0 / tempoInfo.value) * (256 * barLength);
    loopStart = (1 - relPlayPos) * trackLength + am.curTime();
  }

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

    if (kickNoteArr[step] > 0) {
      playSound("kick", step * stepLength);
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
  kickDisplay = getById("kickDisp");
  snareDisplay = getById("snareDisp");
  percDisplay = getById("percDisp");

  playHead = getById("playHead");

  chComplexitySlider = getById("chComplexity");
  chAncestralSlider = getById("chAncestral");
  kickComplexitySlider = getById("kickComplexity");
  kickAncestralSlider = getById("kickAncestral");
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
  kickModel = JSON.parse(getById("kickModel").innerHTML);

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

  chNoteArr = nm.CalculateCh(chComplexitySlider.value, chAncestralSlider.value);
  kickNoteArr = nm.CalculateKick(
    kickComplexitySlider.value,
    kickAncestralSlider.value
  );
  snrNoteArr = nm.CalculateSnare(snarePattern.value);
  percNoteArr = nm.CalculatePerc(perc1Bars, perc2Bars);
  dem.Display(chNoteArr, notes[ch]);
  dem.Display(kickNoteArr, notes[kick]);
  dem.Display(snrNoteArr, notes[snr]);
  dem.Display(percNoteArr, notes[perc]);
}
