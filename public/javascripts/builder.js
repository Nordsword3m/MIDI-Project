const getById = function (id) {
  return document.getElementById(id);
};

// Page Elements
let display = null;
let complexitySlider = null;
let ancestralSlider = null;
let playHead = null;
let tempoInfo = null;
let notes = null;

// Step constants
const barLength = 1 / 8;
const noteLength = 1 / 32;
const stepLength = 1 / 256;

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
let noteArr = null;
let chModel = null;

// Audio context objects
let audioCtx;

// Audio buffers
let m1;
let m2;
let ch;

// PLAY PROCESSING-------------------------------------------------------------------------
function Playing() {
  // Playing routine, run as frequently as possible
  let timeDelta = audioCtx.currentTime - prevPlayTime;
  prevPlayTime = audioCtx.currentTime;
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

  if (audioCtx) {
    audioCtx.close();
    audioCtx = undefined;
  }

  if (play) {
    await NewContext();
    prevPlayTime = audioCtx.currentTime;
    playStart = audioCtx.currentTime;
    clearInterval(playTimerID);
    playTimerID = setInterval(Playing, 2);

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
  playHead.style.left =
    relPlayPos * (display.offsetWidth - 1) + display.offsetLeft + "px";
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

// NOTE PLAYING-------------------------------------------------------------------------
function scheduleNotes() {
  for (let i = 0; i < chunkSize * 256; i++) {
    const step = relNextChunk * 256 + i;

    if (noteArr[step] > 0) {
      playSound(ch, step * stepLength);
    }
  }
}

// METRONOME-----------------------------------------------------------------------------
function scheduleMets() {
  for (let i = 0; i < chunkSize * 256; i++) {
    const step = relNextChunk * 256 + i;

    if ((step / (256 * noteLength)) % 1 === 0) {
      if ((step / (256 * barLength)) % 1 === 0) {
        playSound(m1, step * stepLength);
      } else {
        playSound(m2, step * stepLength);
      }
    }
  }
}

// AUDIO PROCESSING------------------------------------------------------------
async function NewContext() {
  audioCtx = new AudioContext();

  let bl = new BufferLoader(
    audioCtx,
    ["m1.wav", "m2.wav", "ch.wav"],
    finishedLoading
  );

  await bl.load();
}

function finishedLoading(bufferList) {
  m1 = bufferList[0];
  m2 = bufferList[1];
  ch = bufferList[2];
}

function playSound(buffer, pos) {
  let source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);

  let trackLength = (60.0 / tempoInfo.value) * 32;
  let loopStart = audioCtx.currentTime - relPlayPos * trackLength;

  source.start(loopStart + pos * trackLength);
}

// SETUP AND WINDOW STUFF-----------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  display = getById("display");

  display.addEventListener("click", function (event) {
    TogglePlaying(
      (event.pageX - display.offsetLeft) / display.offsetWidth,
      true
    );
  });

  getById("playButton").addEventListener("click", function () {
    TogglePlaying(0, !playing);
  });

  playHead = getById("playHead");
  complexitySlider = getById("complexity");
  ancestralSlider = getById("ancestral");
  tempoInfo = getById("tempoInput");

  DisplayDivisions();

  chModel = JSON.parse(getById("chModel").innerHTML);

  notes = InitialiseNotes();

  CalculateNotes();
  DisplayNotes(noteArr, notes);

  complexitySlider.addEventListener("input", function () {
    CalculateNotes();
    DisplayNotes(noteArr, notes);
  });

  ancestralSlider.addEventListener("input", function () {
    CalculateNotes();
    DisplayNotes(noteArr, notes);
  });
});

window.addEventListener("resize", function () {
  for (let i = 0; i < 256; i++) {
    PlaceNote(notes[i]);
  }
});

// ALGORITHM STUFF---------------------------------------------------------------------
function CalculateNotes() {
  noteArr = [];

  for (let i = 0; i < 256; i++) {
    let trueValue = chModel.positional[i];

    let ancestralValue = 0;
    let validAncestors = 0;

    for (let div = 0; div < chModel.ancestralProbability[i].length; div++) {
      if (noteArr[div] > 0) {
        ancestralValue += chModel.ancestralProbability[i][div];
        validAncestors += 1;
      }
    }

    if (validAncestors > 0) {
      ancestralValue /= validAncestors;
    }

    if (i === 0) {
      ancestralValue = chModel.positional[i];
    }

    trueValue +=
      (ancestralValue - chModel.positional[i]) * ancestralSlider.value;

    if (trueValue >= 1 - complexitySlider.value) {
      noteArr[i] = 60;
    } else {
      noteArr[i] = 0;
    }
  }
}

// VISUAL STUFF----------------------------------------------------------------------
function InitialiseNotes() {
  for (let i = 0; i < 256; i++) {
    CreateNote(i);
  }

  return document.getElementsByClassName("note");
}

function DisplayNotes(notes, noteObjs) {
  for (let i = 0; i < 256; i++) {
    if (notes[i] === 0) {
      noteObjs[i].style.visibility = "hidden";
    } else {
      noteObjs[i].style.visibility = "visible";
    }
  }
}

function PlaceNote(note) {
  note.style.left =
    (parseInt(note.id.substring(4)) / 256) * (display.offsetWidth - 1) +
    display.offsetLeft +
    "px";
}

function CreateNote(i) {
  let note = document.createElement("div");

  note.id = "note" + i;
  note.className = "note";

  PlaceNote(note);

  display.appendChild(note);
}

function DisplayDivisions() {
  function CreateDivision(i) {
    let div = document.createElement("div");

    div.className = "division";
    div.id = "div" + i;
    div.style.opacity = "" + (i % 4 === 0 ? 1 : 0.3);
    div.style.left = (i / numOfDivs) * 100 + "%";

    display.appendChild(div);
  }

  for (let i = 1; i < numOfDivs; i++) {
    CreateDivision(i);
  }
}
