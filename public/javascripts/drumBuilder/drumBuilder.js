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

let drumClone = true;

let chPatterns;
let kickPatterns;

//State variables

let nm = new DrumNoteManager();

//Performance enhancing
let updateDelay = 150;
let lastUpdateTime = 0;
let nextUpdate;
let updateQueued = false;

function toggleDrumClone() {
  setDrumClone(!drumClone);
  ShowNotes("calcDrums");
}

function setDrumClone(clone) {
  drumClone = clone;

  if (clone) {
    getById("drumCloneButton").classList.add("cloneOn");
  } else {
    getById("drumCloneButton").classList.remove("cloneOn");
  }
}

// SAVE AND LOAD STUFF--------------------------------------------------------------------
function loadDrumDataValues() {
  getById("seedInput").value = drumData.seed;
  setDrumClone(drumData.cloneDrums);

  kickCohesionSlider.value = drumData.kickCohesion;
  kickSpontaneitySlider.value = drumData.kickSpontaneity;
  kickQuirkSlider.value = drumData.kickQuirk;
  kickComplexitySlider.value = drumData.kickComplexity;

  chCohesionSlider.value = drumData.chCohesion;
  chSpontaneitySlider.value = drumData.chSpontaneity;
  chQuirkSlider.value = drumData.chQuirk;
  chComplexitySlider.value = drumData.chComplexity;

  snarePattern = drumData.snarePattern;

  perc1Pos.value = drumData.perc1Pos;
  percBars[0] = drumData.perc1Bars;

  perc2Pos.value = drumData.perc2Pos;
  percBars[1] = drumData.perc2Bars;

  setPercBars();
  setSnarePattern();
}

function saveDrumDataValues() {
  let data = {
    seed: getById("seedInput").value,
    cloneDrums: drumClone,

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

    perc2Pos: perc2Pos.value,
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

  ShowNotes("calcDrums");
}

// CALCULATE PATTERNS---------------------------------------------------------------------------------------
function calculatePatterns(changeInst) {
  let start = window.performance.now();
  if (changeInst === "ch" || changeInst === "allDrums" || changeInst === "calcDrums") {
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

  if (changeInst === "kick" || changeInst === "allDrums" || changeInst === "calcDrums") {
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

  ShowNotes('perc');
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
  let snrOpts = getByClass("toggleOption");

  if (snarePattern === "3") {
    snrOpts[0].classList.add("selected");
    snrOpts[1].classList.remove("selected");
  } else if (snarePattern === "2and4") {
    snrOpts[0].classList.remove("selected");
    snrOpts[1].classList.add("selected");
  }
}

function toggleSnarePattern() {
  let snrOpts = getByClass("toggleOption");

  if (snarePattern === "3") {
    snarePattern = "2and4";
  } else {
    snarePattern = "3";
  }

  setSnarePattern();

  ShowNotes('snr');
}

async function loadDrumBuilder() {
  readyStates.declarePresence("drums");

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
    saveDrumDataValues();
  });

  await readyStates.waitFor("demLoad");

  dem.InitialiseDrumNotes();

  loadDrumDataValues();
  ShowNotes("noncalcDrums");

  await readyStates.waitFor("instDataLoad");

  seedModel();
  readyStates.readyUp("drums");
}

function ShowNotes(changeInst) {
  if (lastUpdateTime + updateDelay > window.performance.now()) {
    nextUpdate = changeInst;
    if (!updateQueued) {
      updateQueued = true;
      setTimeout(() => {
        ShowNotes(nextUpdate);
        updateQueued = false;
      }, (lastUpdateTime + updateDelay) - window.performance.now());
    }
  } else {
    lastUpdateTime = window.performance.now();
    calculatePatterns(changeInst);
    saveDrumDataValues();

    if (changeInst === "ch" || changeInst === "allDrums" || changeInst === "calcDrums") {
      chNoteArr = nm.CalculateNotes(chPatterns, chComplexitySlider.value, drumClone);
      dem.Display("ch", chNoteArr);
    }
    if (changeInst === "kick" || changeInst === "allDrums" || changeInst === "calcDrums") {
      kickNoteArr = nm.CalculateNotes(kickPatterns, kickComplexitySlider.value, drumClone);
      dem.Display("kick", kickNoteArr);
    }
    if (changeInst === "snr" || changeInst === "allDrums" || changeInst === "noncalcDrums") {
      snrNoteArr = nm.CalculateSnare(snarePattern);
      dem.Display("snr", snrNoteArr);
    }
    if (changeInst === "perc" || changeInst === "allDrums" || changeInst === "noncalcDrums") {
      percNoteArr = nm.CalculatePerc(percBars[0], parseInt(perc1Pos.value), percBars[1], parseInt(perc2Pos.value));
      dem.Display("perc", percNoteArr);
    }
  }

  generateBassNotes();
}