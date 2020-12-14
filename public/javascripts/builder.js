let display = null;
let complexitySlider = null;
let ancestralSlider = null;
let playHead = null;
let tempoInfo = null;

let noteArr = null;

let chModel = null;
let numOfDivs = 64;
let notes = null;

let playing = false;

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

let prevPlayPos;
let playPos = 0;
let relPlayPos = 0;

let playTimerID;
let playStart = 0;

let nextBar = 0;
let relNextBar = 0;

let m1;
let m2;

let bufferLoader = new BufferLoader(
  audioCtx,
  ["m1.wav", "m2.wav"],
  finishedLoading
);
bufferLoader.load();

function finishedLoading(bufferList) {
  m1 = bufferList[0];
  m2 = bufferList[1];
}

function playSound(buffer, time) {
  let source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(time);
}

function Playing() {
  let timeDelta = audioCtx.currentTime - prevPlayPos;
  prevPlayPos = audioCtx.currentTime;
  let trackLength = (60.0 / tempoInfo.value) * 32;

  setPlayPos(playPos + timeDelta / trackLength);

  if (playPos >= nextBar) {
    NextBar();
  }

  SetHeadPos();
}

function NextBar() {
  scheduleMets(nextBar);

  setNextBar(nextBar + 1 / 8);
}

function scheduleMets(barStart) {
  let beatDur = 60.0 / tempoInfo.value;
  let trackLength = (60.0 / tempoInfo.value) * 32;

  playSound(m1, playStart + barStart * trackLength);
  playSound(m2, playStart + (barStart * trackLength + beatDur));
  playSound(m2, playStart + (barStart * trackLength + beatDur * 2));
  playSound(m2, playStart + (barStart * trackLength + beatDur * 3));
}

function TogglePlaying(pos, val) {
  playing = val;

  if (val) {
    prevPlayPos = audioCtx.currentTime;
    playStart = audioCtx.currentTime;
    clearInterval(playTimerID);
    playTimerID = setInterval(Playing, 2);
  } else {
    clearInterval(playTimerID);
    setPlayPos(0);
    setNextBar(0);
  }

  SetHeadPos();
}

function setPlayPos(pos) {
  playPos = pos;
  relPlayPos = playPos % 1;
}

function setNextBar(bar) {
  nextBar = bar;
  relNextBar = nextBar % 1;
}

function SetHeadPos() {
  playHead.style.left =
    relPlayPos * (display.offsetWidth - 1) + display.offsetLeft + "px";
}

document.addEventListener("DOMContentLoaded", function () {
  display = document.getElementById("display");

  display.addEventListener("click", function (event) {
    /*TogglePlaying(
      (event.pageX - display.offsetLeft) / display.offsetWidth,
      true
    );*/
  });

  document.getElementById("playButton").addEventListener("click", function () {
    TogglePlaying(0, !playing);
  });

  playHead = document.getElementById("playHead");
  complexitySlider = document.getElementById("complexity");
  ancestralSlider = document.getElementById("ancestral");
  tempoInfo = document.getElementById("tempoInput");

  DisplayDivisions();

  chModel = JSON.parse(document.getElementById("chModel").innerHTML);

  notes = InitialiseNotes();

  noteArr = CalculateNotes();
  DisplayNotes(noteArr, notes);

  complexitySlider.addEventListener("input", function () {
    noteArr = CalculateNotes();
    DisplayNotes(noteArr, notes);
  });

  ancestralSlider.addEventListener("input", function () {
    noteArr = CalculateNotes();
    DisplayNotes(noteArr, notes);
  });
});

window.addEventListener("resize", function () {
  for (let i = 0; i < 256; i++) {
    PlaceNote(notes[i]);
  }
});

function CalculateNotes() {
  let noteArr = [];

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
  return noteArr;
}

// VISUAL STUFF----------------------------------------------------------------------
function InitialiseNotes() {
  for (let i = 0; i < 256; i++) {
    CreateNote(i, i / 256);
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
    div.style.opacity = "" + 1 / Math.log2(GetDenominator(i, numOfDivs));
    div.style.left = (i / numOfDivs) * 100 + "%";

    display.appendChild(div);
  }

  for (let i = 1; i < numOfDivs; i++) {
    CreateDivision(i);
  }
}

function GetDenominator(num, den) {
  let gcd = 1;
  for (let i = 1; i <= den / 2; i++) {
    if (num % i === 0 && den % i === 0) {
      gcd = i;
    }
  }
  return den / gcd;
}
