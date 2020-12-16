const getById = function (id) {
  return document.getElementById(id);
};

// Page Elements
let display = null;
let divisionDisplay = null;
let hihatDisplay = null;
let snareDisplay = null;

let complexitySlider = null;
let ancestralSlider = null;
let snarePattern = null;

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
let chNoteArr = null;
let snrNoteArr = null;
let chModel = null;

// Audio context objects
let audioCtx;

// Audio buffers
let m1Audio;
let m2Audio;
let chAudio;
let snrAudio;

// Index ids
const ch = 0;
const snr = 1;
const kik = 2;
const oh = 3;

//State variables
let metroActive = true;

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

// NOTE PLAYING-------------------------------------------------------------------------
function scheduleNotes() {
  for (let i = 0; i < chunkSize * 256; i++) {
    const step = relNextChunk * 256 + i;

    if (chNoteArr[step] > 0) {
      playSound(chAudio, step * stepLength);
    }

    if (snrNoteArr[step] > 0) {
      playSound(snrAudio, step * stepLength);
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
          playSound(m1Audio, step * stepLength);
        } else {
          playSound(m2Audio, step * stepLength);
        }
      }
    }
  }
}

function toggleMetronome(elem) {
  elem.classList.toggle("iconOff");
  metroActive = !metroActive;
}

// AUDIO PROCESSING------------------------------------------------------------
async function NewContext() {
  audioCtx = new AudioContext();

  let bl = new BufferLoader(
    audioCtx,
    ["m1.wav", "m2.wav", "ch.wav", "snr.wav"],
    finishedLoading
  );

  await bl.load();
}

function finishedLoading(bufferList) {
  m1Audio = bufferList[0];
  m2Audio = bufferList[1];
  chAudio = bufferList[2];
  snrAudio = bufferList[3];
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
  divisionDisplay = getById("divDisp");
  hihatDisplay = getById("hihatDisp");
  snareDisplay = getById("snareDisp");

  display.addEventListener("click", function (event) {
    TogglePlaying(
      (event.pageX - display.offsetLeft) / display.offsetWidth,
      true
    ).then();
  });

  getById("playButton").addEventListener("click", function () {
    TogglePlaying(0, !playing).then();
  });

  playHead = getById("playHead");
  complexitySlider = getById("complexity");
  ancestralSlider = getById("ancestral");

  snarePattern = getById("snarePatternSelect");

  tempoInfo = getById("tempoInput");

  DisplayDivisions();

  chModel = JSON.parse(getById("chModel").innerHTML);

  notes = InitialiseNotes();

  ShowNotes();

  snarePattern.addEventListener("input", function () {
    ShowNotes();
  });

  complexitySlider.addEventListener("input", function () {
    ShowNotes();
  });

  ancestralSlider.addEventListener("input", function () {
    ShowNotes();
  });
});

function ShowNotes() {
  CalculateChNotes();
  SetSnareNotes();
  DisplayNotes(chNoteArr, notes[ch]);
  DisplayNotes(snrNoteArr, notes[snr]);
}

window.addEventListener("resize", function () {
  for (let i = 0; i < 256; i++) {
    PlaceNote(notes[ch][i], i / 256, hihatDisplay);
  }
});

// ALGORITHM STUFF---------------------------------------------------------------------
function SetSnareNotes() {
  snrNoteArr = new Array(256).fill(0);

  for (let i = 0; i < 256; i++) {
    if ((i / (256 * noteLength)) % 1 === 0) {
      if ((i / (256 * barLength)) % 1 !== 0) {
        let notePos = i * barLength;

        if (snarePattern.value === "3" && notePos % 4 === 2) {
          snrNoteArr[i] = 60;
        } else if (
          snarePattern.value === "2and4" &&
          (notePos % 4 === 1 || notePos % 4 === 3)
        ) {
          snrNoteArr[i] = 60;
        }
      }
    }
  }
}

function CalculateChNotes() {
  chNoteArr = [];

  for (let i = 0; i < 256; i++) {
    let trueValue = chModel.positional[i];

    let ancestralValue = 0;
    let validAncestors = 0;

    for (let div = 0; div < chModel.ancestralProbability[i].length; div++) {
      if (chNoteArr[div] > 0) {
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
      chNoteArr[i] = 60;
    } else {
      chNoteArr[i] = 0;
    }
  }
}

// VISUAL STUFF----------------------------------------------------------------------
function InitialiseNotes() {
  let chNotes = new Array(256);
  let snrNotes = new Array(256);

  for (let i = 0; i < 256; i++) {
    chNotes[i] = CreateChNote(i);

    if ((i / (256 * noteLength)) % 1 === 0) {
      if ((i / (256 * barLength)) % 1 !== 0) {
        snrNotes[i] = CreateSnrNote(i, i / 256);
      }
    }
  }

  return [chNotes, snrNotes];
}

function DisplayNotes(notes, noteObjs) {
  for (let i = 0; i < 256; i++) {
    if (noteObjs[i]) {
      if (notes[i] === 0) {
        noteObjs[i].style.visibility = "hidden";
      } else {
        noteObjs[i].style.visibility = "visible";
      }
    }
  }
}

function PlaceNote(note, disp) {
  note.style.left =
    (parseInt(note.id.substring(note.id.search("Note") + 4)) / 256) *
      disp.offsetWidth +
    disp.offsetLeft +
    "px";
}

function CreateChNote(i) {
  let note = document.createElement("div");

  note.id = "chNote" + i;
  note.className = "note";

  PlaceNote(note, hihatDisplay);

  hihatDisplay.appendChild(note);
  return note;
}

function CreateSnrNote(i) {
  let note = document.createElement("div");

  note.id = "snrNote" + i;
  note.className = "note";

  PlaceNote(note, snareDisplay);

  snareDisplay.appendChild(note);
  return note;
}

function DisplayDivisions() {
  for (let i = 1; i < numOfDivs; i++) {
    CreateDivision(i);
  }
}

function CreateDivision(i) {
  let div = document.createElement("div");

  div.className = "division";
  div.id = "div" + i;
  div.style.opacity = "" + (i % 4 === 0 ? 1 : 0.3);
  div.style.left = (i / numOfDivs) * 100 + "%";

  divisionDisplay.appendChild(div);
}
