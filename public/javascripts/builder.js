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

let snarePattern = "3";

let percBars = new Array(2).fill(0).map(() => new Array(8).fill(false));

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

let playing = false;

let nextChunk = 0;
let relNextChunk = 0;
let chunkPreRender = 1 / 2;

const chunkSize = noteLength / 2;

// Note calculation processing
let chNoteArr = null;
let kickNoteArr = null;
let snrNoteArr = null;
let percNoteArr = null;

let chModel = null;
let kickModel = null;

let source;

// Index ids
const kick = 0;
const ch = 1;
const snr = 2;
const perc = 3;

//State variables
let metroActive = false;

let am = new AudioManager(["m1", "m2", "kick", "ch", "snr", "perc"]);
am.SetDefaultBuffers().then();

let nm = new NoteManager();
let dem = new DisplayElementManager();

//Mute/Solo variables
let mutes = new Array(4).fill(false);
let solos = new Array(4).fill(false);

//Region control variables
let kickRegionsOn = false;
let chRegionsOn = false;

let curRegion = 0;

class regionInfo {
  constructor(complexity, ancestral) {
    this.complexity = complexity;
    this.ancestral = ancestral;
  }
}

let kickRegions = new Array(8);
let chRegions = new Array(8);

for (let i = 0; i < 8; i++) {
  kickRegions[i] = new regionInfo(0, 0);
  chRegions[i] = new regionInfo(0, 0);
}

//Tap tempo variables
let curTap = 0;
let prevTaps = [];
let tapTimeoutTimer;

// TEMPO TAPPING-------------------------------------------------------------------
function tapTempoButton() {
  prevTaps.unshift(am.curTime());

  if (prevTaps.length >= 8) {
    tempoInfo.value =
      60 /
      ((prevTaps[0] - prevTaps[Math.min(16, prevTaps.length - 1)]) /
        Math.min(16, prevTaps.length - 1));
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

// SEED CONTROLS------------------------------------------------------------------
function randomizeSeed() {
  getById("seedInput").value = Math.floor(Math.random() * 1000);
  seedModel(getById("seedInput"));
}

function seedModel(elem) {
  elem.value = elem.value.slice(0, 3);

  calculateModels();

  ShowNotes();
}

// REGION CONTROLS------------------------------------------------------------------------
function calculateModels() {
  chModel = nm.GenerateModel(source[ch], getById("seedInput").value);
  kickModel = nm.GenerateModel(source[kick], getById("seedInput").value);
}

function processRegions() {
  if (chRegionsOn) {
    chRegions[curRegion].complexity = chComplexitySlider.value;
    chRegions[curRegion].ancestral = chAncestralSlider.value;
  } else {
    chRegions.forEach(function (r) {
      r.complexity = chComplexitySlider.value;
      r.ancestral = chAncestralSlider.value;
    });
  }

  if (kickRegionsOn) {
    kickRegions[curRegion].complexity = kickComplexitySlider.value;
    kickRegions[curRegion].ancestral = kickAncestralSlider.value;
  } else {
    kickRegions.forEach(function (r) {
      r.complexity = kickComplexitySlider.value;
      r.ancestral = kickAncestralSlider.value;
    });
  }
}

function selctRegion(elem) {
  getByClass("regionSelection")[curRegion].classList.remove("selected");
  elem.classList.add("selected");

  curRegion = elem.dataset.bar;

  let regHighlight = getById("regionHighlight");
  regHighlight.style.opacity = "1";
  regHighlight.style.left = barLength * elem.dataset.bar * 100 + "%";

  if (chRegionsOn) {
    chComplexitySlider.value = chRegions[curRegion].complexity;
    chAncestralSlider.value = chRegions[curRegion].ancestral;
  }

  if (kickRegionsOn) {
    kickComplexitySlider.value = kickRegions[curRegion].complexity;
    kickAncestralSlider.value = kickRegions[curRegion].ancestral;
  }
}

function toggleRegionControls(elem, inst) {
  elem.classList.toggle("selected");

  if (inst === "kick") {
    kickRegionsOn = !kickRegionsOn;
  } else if (inst === "ch") {
    chRegionsOn = !chRegionsOn;
  }

  let regHighlight = getById("regionHighlight");

  if (kickRegionsOn || chRegionsOn) {
    if (!getById("regionSelect").classList.contains("enabled")) {
      getById("regionSelect").classList.add("enabled");
      selctRegion(getByClass("regionSelection")[0]);
    }
  } else {
    getById("regionSelect").classList.remove("enabled");

    regHighlight.style.opacity = "0";
    getByClass("regionSelection")[curRegion].classList.remove("selected");
  }

  ShowNotes();
}

// SOUND UPLOAD STUFF---------------------------------------------------------------------------
async function browseUpload(name, file, elem) {
  if (file.type.includes("audio")) {
    elem.parentElement.children[0].textContent =
      file.name.slice(0, file.name.lastIndexOf(".")).slice(0, 7) + "...";
    await am.ReplaceBuffer(name, file);
  }
}

async function dragUpload(ev, inst) {
  ev.preventDefault();

  let item = ev.dataTransfer.items[0];

  if (item) {
    if (item.kind === "file" && item.type.includes("audio")) {
      await am.ReplaceBuffer(inst, item.getAsFile());
    }
  }
}

function dragOverHandler(ev) {
  ev.preventDefault();
}

// MUTE / SOLO OPERATIONS-------------------------------------------------------------------------------------------------------
function toggleMute(inst, elem) {
  elem.classList.toggle("selected");
  mutes[inst] = !mutes[inst];
  solos[inst] = false;

  let soloButton = elem.parentElement.getElementsByClassName("soloButton")[0];
  soloButton.classList.remove("selected");
}

function toggleSolo(inst, elem) {
  elem.classList.toggle("selected");
  solos[inst] = !solos[inst];
  mutes[inst] = false;

  let muteButton = elem.parentElement.getElementsByClassName("muteButton")[0];
  muteButton.classList.remove("selected");
}

function soloPresent() {
  let res = false;

  solos.forEach((x) => (res ||= x));

  return res;
}

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
  am.play(name, pos, tempoInfo.value);
}

// NOTE PLAYING-------------------------------------------------------------------------
function scheduleNotes() {
  for (let i = 0; i < chunkSize * 256; i++) {
    const step = relNextChunk * 256 + i;

    if (chNoteArr[step] > 0) {
      if (!mutes[ch] && (!soloPresent() || solos[ch])) {
        playSound("ch", step * stepLength);
      }
    }

    if (kickNoteArr[step] > 0) {
      if (!mutes[kick] && (!soloPresent() || solos[kick])) {
        playSound("kick", step * stepLength);
      }
    }

    if (snrNoteArr[step] > 0) {
      if (!mutes[snr] && (!soloPresent() || solos[snr])) {
        playSound("snr", step * stepLength);
      }
    }

    if (percNoteArr[step] > 0) {
      if (!mutes[perc] && (!soloPresent() || solos[perc])) {
        playSound("perc", step * stepLength);
      }
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
  elem.classList.toggle("metOn");
  metroActive = !metroActive;
}

// SETUP AND WINDOW STUFF-----------------------------------------------------------------
document.onkeydown = function (e) {
  if (e.key === " ") {
    TogglePlaying(0, !playing).then();
  } else if (e.key === ".") {
    tapTempoButton(getById("tapButton"));
  }
};

function showPercGhostNote(elem, show) {
  let offset = elem.dataset.perc === "1" ? 4 : 28;
  let id = elem.dataset.bar * 256 * barLength + offset;
  let note = getById("percNote" + id);

  if (show) {
    note.classList.add("ghost");
  } else {
    note.classList.remove("ghost");
  }

  if (percNoteArr[id] === 0) {
    if (show) {
      note.classList.add("visible");
    } else {
      note.classList.remove("visible");
    }
  }
}

function barSelect(elem) {
  elem.classList.toggle("selected");

  percBars[elem.dataset.perc - 1][elem.dataset.bar] = !percBars[
    elem.dataset.perc - 1
  ][elem.dataset.bar];

  ShowNotes();
}

function toggleSnarePattern(elem) {
  [].slice.call(elem.children).forEach((e) => e.classList.toggle("selected"));

  if (snarePattern === "3") {
    snarePattern = "2and4";
  } else {
    snarePattern = "3";
  }

  ShowNotes();
}

document.addEventListener("DOMContentLoaded", async function () {
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

  tempoInfo = getById("tempoInput");

  getById("randomSeedButton").addEventListener("click", () => randomizeSeed());

  getById("bpmSuffix").addEventListener("mousedown", () => tapTempoButton());

  display.addEventListener("click", function (event) {
    TogglePlaying(
      (event.pageX - display.offsetLeft) / display.offsetWidth,
      true
    ).then();
  });

  getById("playButton").addEventListener("click", function () {
    TogglePlaying(0, !playing).then();
  });

  await loadSource();

  calculateModels();

  notes = dem.InitialiseNotes();
  dem.CreateDivisions();

  ShowNotes();

  let optns = document.getElementsByClassName("configOption");
  for (let i = 0; i < optns.length; i++) {
    optns[i].addEventListener("input", () => ShowNotes());
  }

  let percSelects = getByClass("barOption");

  for (let i = 0; i < percSelects.length; i++) {
    percSelects[i].addEventListener("click", () => barSelect(percSelects[i]));
    percSelects[i].addEventListener("mouseover", () =>
      showPercGhostNote(percSelects[i], true)
    );
    percSelects[i].addEventListener("mouseleave", () =>
      showPercGhostNote(percSelects[i], false)
    );
  }

  let regSelects = getByClass("regionSelection");

  for (let i = 0; i < regSelects.length; i++) {
    regSelects[i].addEventListener("click", () => selctRegion(regSelects[i]));
  }
});

function ShowNotes() {
  processRegions();

  chNoteArr = nm.CalculateCh(chRegions, getById("seedInput").value);
  kickNoteArr = nm.CalculateKick(kickRegions, getById("seedInput").value);

  snrNoteArr = nm.CalculateSnare(snarePattern);
  percNoteArr = nm.CalculatePerc(percBars[0], percBars[1]);
  dem.Display(chNoteArr, notes[ch]);
  dem.Display(kickNoteArr, notes[kick]);
  dem.Display(snrNoteArr, notes[snr]);
  dem.Display(percNoteArr, notes[perc]);
}

function loadSource() {
  // Load buffer asynchronously
  let request = new XMLHttpRequest();

  return new Promise(function (resolve, reject) {
    request.open("GET", "sourceData.txt", true);
    request.responseType = "json";

    request.onload = function () {
      source = request.response;
      resolve();
    };

    request.onerror = function () {
      alert("Source: XHR error");
      reject();
    };

    request.send();
  });
}
