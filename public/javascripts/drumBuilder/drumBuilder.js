let kickPatternCache, chPatternCache;

function getDrumCaches() {
  let db, tx, store;

  return new Promise(function (resolve, reject) {
    let request = indexedDB.open("cacheDB", 1);

    request.onerror = function (e) {
      console.log("Database failed to open" + e.target.errorCode);
    };

    request.onsuccess = async function (e) {
      db = e.target.result;
      tx = db.transaction("cacheStore", "readwrite");
      store = tx.objectStore("cacheStore");

      db.onerror = function (e) {
        console.error("Database error: " + e.target.errorCode);
      };

      let results = 0;

      kickPatternCache = store.get("kickPatternCache");
      kickPatternCache.onsuccess = () => {
        kickPatternCache = kickPatternCache.result.cache;

        results++;
        if (results === 2) {
          resolve();
        }
      }

      chPatternCache = store.get("chPatternCache");
      chPatternCache.onsuccess = () => {
        chPatternCache = chPatternCache.result.cache;

        results++;
        if (results === 2) {
          resolve();
        }
      }

      tx.oncomplete = () => db.close();
    };
  });
}

// Page Elements
let display;
let divisionDisplay;

let chCohesionSlider;
let chSpontaneitySlider;
let chQuirkSlider;
let chComplexitySlider;

let kickCohesionSlider;
let kickSpontaneitySlider;
let kickQuirkSlider;
let kickComplexitySlider;

let snarePattern = "3";

let percBars = new Array(2).fill(0).map(() => new Array(8).fill(false));

let perc1Pos;
let perc2Pos;

const numOfDivs = 32;

// Note calculation processing
let chNoteArr;
let kickNoteArr;
let snrNoteArr;
let percNoteArr;

let chPatterns;
let kickPatterns;

let drumSource;

//State variables

let nm = new DrumNoteManager();
let dem;

//Mute/Solo variables
let mutes = new Array(4).fill(false);
let solos = new Array(4).fill(false);

//Performance enhancing
let updateDelay = 150;
let lastUpdateTime = 0;
let nextUpdate;
let updateQueued = false;

// SAVE AND LOAD STUFF--------------------------------------------------------------------
function loadData() {
  let data = JSON.parse(sessionStorage.getItem("drumData"));

  if (data) {
    getById("seedInput").value = data.seed;

    kickCohesionSlider.value = data.kickCohesion
    kickSpontaneitySlider.value = data.kickSpontaneity
    kickQuirkSlider.value = data.kickQuirk
    kickComplexitySlider.value = data.kickComplexity

    chCohesionSlider.value = data.chCohesion
    chSpontaneitySlider.value = data.chSpontaneity
    chQuirkSlider.value = data.chQuirk
    chComplexitySlider.value = data.chComplexity

    snarePattern = data.snarePattern

    perc1Pos.value = data.perc1Pos
    percBars[0] = data.perc1Bars

    perc1Pos.value = data.perc2Pos
    percBars[1] = data.perc2Bars
  } else {
    snarePattern = "3";
    getById("seedInput").value = Math.floor(Math.random() * 1000);
  }

  setPercBars();
  setSnarePattern();
}

function saveData() {
  let data = {
    seed: getById("seedInput").value,

    kickCohesion: kickCohesionSlider.value,
    kickCohesionMin: kickCohesionSlider.min,
    kickSpontaneity: kickSpontaneitySlider.value,
    kickQuirk: kickQuirkSlider.value,
    kickComplexity: kickComplexitySlider.value,

    chCohesion: chCohesionSlider.value,
    chCohesionMin: chCohesionSlider.min,
    chSpontaneity: chSpontaneitySlider.value,
    chQuirk: chQuirkSlider.value,
    chComplexity: chComplexitySlider.value,

    snarePattern: snarePattern,

    perc1Pos: perc1Pos.value,
    perc1Bars: percBars[0],

    perc2Pos: perc1Pos.value,
    perc2Bars: percBars[1]
  };

  sessionStorage.setItem("drumData", JSON.stringify(data));
}

// SEED CONTROLS------------------------------------------------------------------
function randomizeSeed() {
  getById("seedInput").value = Math.floor(Math.random() * 1000);
  seedModel(getById("seedInput"));
}

function seedModel() {
  let seedInput = getById("seedInput");

  seedInput.value =
    seedInput.value.length === 0
      ? "000"
      : parseInt(seedInput.value).toString().padStart(3, "0").slice(0, 3);

  ShowNotes(calc);
}

// CALCULATE PATTERNS---------------------------------------------------------------------------------------
function calculatePatterns(changeInst) {
  let start = window.performance.now();
  if (changeInst === ch || changeInst === all || changeInst === calc) {
    chPatterns = nm.RetreivePatterns(
      chPatternCache,
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
    kickPatterns = nm.RetreivePatterns(
      kickPatternCache,
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

// SCHEDULING-------------------------------------------------------------------------
function soundSchedule() {
  scheduleNotes();
}

function scheduleNotes() {
  for (let i = 0; i < chunkSize * 256; i++) {
    const step = pm.relNextChunk * 256 + i;

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

// SETUP AND WINDOW STUFF-----------------------------------------------------------------

function showPercGhostNote(elem, show) {
  let offset = elem.dataset.perc === "1" ? parseInt(perc1Pos.value) : parseInt(perc2Pos.value);
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

function setPercBars() {
  for (let p = 0; p <= 1; p++) {
    for (let b = 0; b < 8; b++) {
      if (percBars[p][b]) {
        getByClass("barOption")[p * 8 + b].classList.add("selected");
      }
    }
  }
}

function setSnarePattern() {
  let snrOpts = getByClass("snrOption");

  if (snarePattern === "3") {
    snrOpts[0].classList.add("selected");
    snrOpts[1].classList.remove("selected");
  } else if (snarePattern === "2and4") {
    snrOpts[0].classList.remove("selected");
    snrOpts[1].classList.add("selected");
  }
}

function toggleSnarePattern(elem) {
  let snrOpts = getByClass("snrOption");

  if (snarePattern === "3") {
    snarePattern = "2and4";
  } else {
    snarePattern = "3";
  }

  setSnarePattern();

  ShowNotes(snr);
}

document.addEventListener("DOMContentLoaded", async function () {
  dem = new DisplayElementManager();

  await am.SetDefaultBuffers();

  await getDrumCaches();

  display = getById("display");
  divisionDisplay = getById("divDisp");

  chCohesionSlider = getById("chCohesion");
  chSpontaneitySlider = getById("chSpontaneity");
  chQuirkSlider = getById("chQuirk");
  chComplexitySlider = getById("chComplexity");
  kickCohesionSlider = getById("kickCohesion");
  kickSpontaneitySlider = getById("kickSpontaneity");
  kickQuirkSlider = getById("kickQuirk");
  kickComplexitySlider = getById("kickComplexity");

  perc1Pos = getById("per1pos");
  perc2Pos = getById("per2pos");

  getById("randomSeedButton").addEventListener("click", () => randomizeSeed());

  display.addEventListener("click", function (event) {
    pm.TogglePlaying(
      (event.pageX - display.offsetLeft) / display.offsetWidth,
      true
    ).then();
  });

  getById("playButton").addEventListener("click", startPlaying);

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

  getById("tempoInput").addEventListener("input", () => {
    saveData();
  });

  loadData();

  dem.InitialiseDrumNotes();
  dem.CreateDivisions();


  seedModel();
  ShowNotes(noncalc);
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
    saveData();

    if (changeInst === ch || changeInst === all || changeInst === calc) {
      chNoteArr = nm.CalculateNotes(chPatterns, chComplexitySlider.value);
      dem.Display(ch, chNoteArr);
    }
    if (changeInst === kick || changeInst === all || changeInst === calc) {
      kickNoteArr = nm.CalculateNotes(kickPatterns, kickComplexitySlider.value);
      dem.Display(kick, kickNoteArr);
    }
    if (changeInst === snr || changeInst === all || changeInst === noncalc) {
      snrNoteArr = nm.CalculateSnare(snarePattern);
      dem.Display(snr, snrNoteArr);
    }
    if (changeInst === perc || changeInst === all || changeInst === noncalc) {
      percNoteArr = nm.CalculatePerc(percBars[0], parseInt(perc1Pos.value), percBars[1], parseInt(perc2Pos.value));
      dem.Display(perc, percNoteArr);
    }
  }
}