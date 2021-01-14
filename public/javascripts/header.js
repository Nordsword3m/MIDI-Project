const getById = function (id) {
  return document.getElementById(id);
};

const getByClass = function (classname) {
  return document.getElementsByClassName(classname);
};

const post = function (url, data) {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(data));
}

let keydownfuncs = [];

let am = new AudioManager(["m1", "m2", "kick", "ch", "snr", "perc"]);
am.SetDefaultBuffers().then();

//Tap tempo variables
let tempo;
let curTap = 0;
let prevTaps = [];
let tapTimeoutTimer;
let tempoInput;


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

document.addEventListener("DOMContentLoaded", async function () {
  keydownfuncs.push((e) => {
    if (e.key === ".") {
      tapTempoButton(getById("tapButton"));
    }
  });

  tempo = getById("tempoInput").value;

  getById("bpmSuffix").addEventListener("mousedown", () => tapTempoButton());
});