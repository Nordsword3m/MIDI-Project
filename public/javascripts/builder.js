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

let chCohesionSlider = null;
let chSpontaneitySlider = null;
let chQuirkSlider = null;

let kickCohesionSlider = null;
let kickSpontaneitySlider = null;
let kickQuirkSlider = null;

let snarePattern = "3";

let percBars = new Array(2).fill(0).map(() => new Array(8).fill(false));

let playHead = null;
let tempoInput = null;
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

let chPatterns = null;
let kickPatterns = null;

let source;

// Index ids
const all = -1;
const kick = 0;
const ch = 1;
const snr = 2;
const perc = 3;
const calc = 10;

//State variables
let metroActive = false;

let am = new AudioManager(["m1", "m2", "kick", "ch", "snr", "perc"]);
am.SetDefaultBuffers().then();

let nm = new NoteManager();
let dem = new DisplayElementManager();

//Mute/Solo variables
let mutes = new Array(4).fill(false);
let solos = new Array(4).fill(false);

//Performance enhancing
let updateDelay = 150;
let lastUpdateTime = 0;
let nextUpdate;
let updateQueued = false;

//Region control variables
let kickRegionsOn = false;
let chRegionsOn = false;

let curRegion = 0;

class regionInfo {
  constructor(cohesion, spontaneity) {
    this.cohesion = cohesion;
    this.spontaneity = spontaneity;
  }
}

let kickRegions = new Array(8);
let chRegions = new Array(8);

for (let i = 0; i < 8; i++) {
  kickRegions[i] = new regionInfo(0, 0);
  chRegions[i] = new regionInfo(0, 0);
}

//Tap tempo variables
let tempo;
let curTap = 0;
let prevTaps = [];
let tapTimeoutTimer;

// TEMPO TAPPING-------------------------------------------------------------------
function setTempo(tmp) {
  tmp = Math.max(tmp, 1);
  tempo = tmp;
  tempoInput.value = Math.round(tmp);
}

function tapTempoButton() {
  prevTaps.unshift(am.curTime());

  if (prevTaps.length >= 8) {
    setTempo(
      60 /
      ((prevTaps[0] - prevTaps[Math.min(16, prevTaps.length - 1)]) /
        Math.min(16, prevTaps.length - 1))
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

// SEED CONTROLS------------------------------------------------------------------
function randomizeSeed() {
  getById("seedInput").value = Math.floor(Math.random() * 1000);
  seedModel(getById("seedInput"));
}

function seedModel(elem) {
  elem.value =
    elem.value.length === 0
      ? "000"
      : parseInt(elem.value).toString().padStart(3, "0").slice(0, 3);

  ShowNotes(calc);
}

// REGION CONTROLS------------------------------------------------------------------------
function calculatePatterns(changeInst) {
  let start = window.performance.now();

  if (changeInst === ch || changeInst === all || changeInst === calc) {
    chPatterns = nm.GeneratePatterns(ch,
      source[ch],
      getById("seedInput").value,
      chCohesionSlider.value,
      Math.round(
        lerp(
          chCohesionSlider.min,
          chCohesionSlider.value,
          1 - chSpontaneitySlider.value
        )
      ),
      1 - chQuirkSlider.value
    )
    ;
  }
  //console.log("Ch time: " + (window.performance.now() - start) + "ms");
  let kickStart = window.performance.now();

  if (changeInst === kick || changeInst === all || changeInst === calc) {
    kickPatterns = nm.GeneratePatterns(kick,
      source[kick],
      getById("seedInput").value,
      kickCohesionSlider.value,
      Math.round(
        lerp(
          kickCohesionSlider.min,
          kickCohesionSlider.value,
          1 - kickSpontaneitySlider.value
        )
      ),
      1 - kickQuirkSlider.value
    );
  }

  //console.log("Kick time: " + (window.performance.now() - kickStart) + "ms");
  //console.log("Operation time: " + (window.performance.now() - start) + "ms");
  updateDelay = (window.performance.now() - start) * 5;
}

function lerp(a, b, t) {
  return parseFloat(a) + (parseFloat(b) - parseFloat(a)) * parseFloat(t);
}

function processRegions() {
  if (chRegionsOn) {
    chRegions[curRegion].cohesion = chCohesionSlider.value;
    chRegions[curRegion].spontaneity = chSpontaneitySlider.value;
  } else {
    chRegions.forEach(function (r) {
      r.cohesion = chCohesionSlider.value;
      r.spontaneity = chSpontaneitySlider.value;
    });
  }

  if (kickRegionsOn) {
    kickRegions[curRegion].cohesion = kickCohesionSlider.value;
    kickRegions[curRegion].spontaneity = kickSpontaneitySlider.value;
  } else {
    kickRegions.forEach(function (r) {
      r.cohesion = kickCohesionSlider.value;
      r.spontaneity = kickSpontaneitySlider.value;
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
    chCohesionSlider.value = chRegions[curRegion].cohesion;
    chSpontaneitySlider.value = chRegions[curRegion].spontaneity;
  }

  if (kickRegionsOn) {
    kickCohesionSlider.value = kickRegions[curRegion].cohesion;
    kickSpontaneitySlider.value = kickRegions[curRegion].spontaneity;
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

  ShowNotes(inst === "kick" ? kick : inst === "ch" ? ch : -10);
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
  let trackLength = (60.0 / tempo) * 32;

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
  let trackLength = (60.0 / tempo) * (256 * barLength);
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
    let trackLength = (60.0 / tempo) * (256 * barLength);
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
  am.play(name, pos, tempo);
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
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
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

  ShowNotes(perc);
}

function toggleSnarePattern(elem) {
  [].slice.call(elem.children).forEach((e) => e.classList.toggle("selected"));

  if (snarePattern === "3") {
    snarePattern = "2and4";
  } else {
    snarePattern = "3";
  }

  ShowNotes(snr);
}

document.addEventListener("DOMContentLoaded", async function () {
  display = getById("display");
  divisionDisplay = getById("divDisp");
  hihatDisplay = getById("hihatDisp");
  kickDisplay = getById("kickDisp");
  snareDisplay = getById("snareDisp");
  percDisplay = getById("percDisp");

  playHead = getById("playHead");

  chCohesionSlider = getById("chCohesion");
  chSpontaneitySlider = getById("chSpontaneity");
  chQuirkSlider = getById("chQuirk");
  kickCohesionSlider = getById("kickCohesion");
  kickSpontaneitySlider = getById("kickSpontaneity");
  kickQuirkSlider = getById("kickQuirk");

  tempoInput = getById("tempoInput");
  tempo = tempoInput.value;

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
  nm.CacheBeatPatterns(ch, source[ch], new NumRange(chCohesionSlider.min, chCohesionSlider.max));
  nm.CacheBeatPatterns(kick, source[kick], new NumRange(kickCohesionSlider.min, kickCohesionSlider.max));

  notes = dem.InitialiseNotes();
  dem.CreateDivisions();

  ShowNotes(all);

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

function ShowNotes(changeInst) {
  if (lastUpdateTime + updateDelay > window.performance.now()) {
    nextUpdate = changeInst;
    if (!updateQueued) {
      updateQueued = true;
      setTimeout(() => {
        ShowNotes(nextUpdate);
        updateQueued = false;
      }, (lastUpdateTime + updateDelay) - window.performance.now())
    }
  } else {
    lastUpdateTime = window.performance.now();
    calculatePatterns(changeInst);
    //processRegions();

    if (changeInst === ch || changeInst === all || changeInst === calc) {
      chNoteArr = nm.CalculateNotes(chPatterns);
      dem.Display(chNoteArr, notes[ch]);
    }
    if (changeInst === kick || changeInst === all || changeInst === calc) {
      kickNoteArr = nm.CalculateNotes(kickPatterns);
      dem.Display(kickNoteArr, notes[kick]);
    }
    if (changeInst === snr || changeInst === all) {
      snrNoteArr = nm.CalculateSnare(snarePattern);
      dem.Display(snrNoteArr, notes[snr]);
    }
    if (changeInst === perc || changeInst === all) {
      percNoteArr = nm.CalculatePerc(percBars[0], percBars[1]);
      dem.Display(percNoteArr, notes[perc]);
    }
  }
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
