function getById(id) {
  return document.getElementById(id);
};

function getByClass(classname) {
  return document.getElementsByClassName(classname);
};

function lerp(a, b, t) {
  return parseFloat(a) + (parseFloat(b) - parseFloat(a)) * parseFloat(t);
}

const post = function (url, data) {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(data));
}

// Index ids
const allDrums = -1;
const kick = 0;
const ch = 1;
const snr = 2;
const perc = 3;
const calcDrums = 10;
const noncalcDrums = 12;


let keydownfuncs = [];

let am = new AudioManager(["m1", "m2", "kick", "ch", "snr", "perc", "C3", "C4", "C5", "C6", "C7"]);
let pm = new PlayManager();

//Tap tempo variables
let tempo;
let curTap = 0;
let prevTaps = [];
let tapTimeoutTimer;
let tempoInput;

let metroActive = false;


function startPlaying() {
  if (am.buffers) {
    pm.TogglePlaying(0, !pm.playing);
  }
}

function toggleLeaveInstrumentIcon() {
  getById("leaveInstrument").classList.toggle('fa-sign-out-alt');
}

// TEMPO TAPPING-------------------------------------------------------------------
function setTempo(tmp) {
  tmp = tmp.length === 0
    ? "001"
    : parseInt(tmp).toString().padStart(3, "0").slice(0, 3);

  tempo = parseInt(tmp);
  getById("tempoInput").value = tmp;
}

function tapTempoButton() {
  prevTaps.unshift(am.curTime());

  if (prevTaps.length >= 8) {
    setTempo(
      60 /
      ((prevTaps[0] - prevTaps[Math.min(32, prevTaps.length - 1)]) /
        Math.min(32, prevTaps.length - 1))
    );
  }

  let bpmSuff = getById("bpmSuffix");

  if (curTap % 4 === 0) {
    am.playNow("m1");
    bpmSuff.classList.add("barTap");
    setTimeout(() => bpmSuff.classList.remove("barTap"), 200);
  } else {
    am.playNow("m2");
    bpmSuff.classList.add("noteTap");
    setTimeout(() => bpmSuff.classList.remove("noteTap"), 200);
  }
  curTap++;

  if (!tapTimeoutTimer) {
    tapTimeoutTimer = setTimeout(() => {
      prevTaps = [];
      curTap = 0;
    }, 2500);
  } else {
    clearTimeout(tapTimeoutTimer);
    tapTimeoutTimer = setTimeout(() => {
      prevTaps = [];
      curTap = 0;
    }, 2500);
  }
}

document.onkeydown = function (e) {
  for (let i = 0; i < keydownfuncs.length; i++) {
    keydownfuncs[i](e);
  }
}

function playSound(name, pos) {
  am.play(name, pos, tempo);
}

function playNote(pitch, pos, length) {
  am.playNote(pitch, pos, tempo, length);
}

function scheduleMets() {
  if (metroActive) {
    for (let i = 0; i < chunkSize * 256; i++) {
      const step = pm.relNextChunk * 256 + i;

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
  elem.classList.toggle("metOn");
  metroActive = !metroActive;
}

document.addEventListener("DOMContentLoaded", async function () {

  keydownfuncs.push((e) => {
    if (e.key === ".") {
      tapTempoButton(getById("tapButton"));
    } else if (e.key === " ") {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      startPlaying();
    }
  });

  getById("playButton").addEventListener("click", startPlaying);

  tempo = getById("tempoInput").value;

  getById("bpmSuffix").addEventListener("mousedown", () => tapTempoButton());
});