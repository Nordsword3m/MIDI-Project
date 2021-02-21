let arrangement;
let grabbing;
let origSect;
let floatSect;

let grabStartX;
let mouseDownSection;
let selectedSect;

let timeLine;

class Arrangement {
  constructor() {
    this.arr = {};
    this.structure = [0, 1, 2, 1, 3, 1, 1, 4];
    this.sections = new Map();

    this.sections.set(0, {
      name: "INTRO",
      parts: [["chords"],
        ["chords", "ch"]]
    });

    this.sections.set(1, {
      name: "CHORUS",
      parts: [["chords", "melo", "bass", "kick", "snare", "ch", "perc"],
        ["chords", "melo", "bass", "kick", "snare", "ch", "perc"]]
    });

    this.sections.set(2, {
      name: "VERSE 1",
      parts: [["chords", "bass", "kick", "snare", "ch"],
        ["chords", "bass", "kick", "snare", "ch", "perc"]]
    });

    this.sections.set(3, {
      name: "VERSE 2",
      parts: [["chords", "melo", "bass", "kick"],
        ["chords", "melo", "bass", "kick", "ch"]]
    });

    this.sections.set(4, {
      name: "OUTRO",
      parts: [["chords", "bass", "kick", "ch"],
        ["chords", "ch"]]
    });

    this.setArrangement();
  }

  getLength() {
    return this.structure.map(x => this.sections.get(x).parts.length).reduce((t, x) => t + x, 0);
  }

  setArrangement() {
    this.arr = {
      chords: [],
      melo: [],
      bass: [],
      kick: [],
      snare: [],
      ch: [],
      perc: []
    };

    let pattPos = 0;

    for (let s = 0; s < this.structure.length; s++) {
      let curSect = this.sections.get(this.structure[s]).parts;
      for (let p = 0; p < curSect.length; p++) {
        for (let inst = 0; inst < curSect[p].length; inst++) {
          this.arr[curSect[p][inst]][pattPos] = true;
        }
        pattPos++;
      }
    }

    document.documentElement.style.setProperty("--patternAmt", this.getLength());
  }

  swapSections(s1, s2) {
    let temp = this.structure[s1];
    this.structure[s1] = this.structure[s2];
    this.structure[s2] = temp;

    this.setArrangement();
  }
}

function setUpTimeLine() {
  let timeLine = getById("timeLine");
  timeLine.textContent = "";

  for (let s = 0; s < arrangement.structure.length; s++) {
    let sect = document.createElement("div");

    let length = arrangement.sections.get(arrangement.structure[s]).parts.length;

    sect.className = "songSection";
    sect.style.width = "calc(100% * " + length + " / var(--patternAmt))";
    sect.innerText = arrangement.sections.get(arrangement.structure[s]).name;
    sect.dataset.sectId = arrangement.structure[s];

    sect.addEventListener("mousedown", () => mouseDownSection = true);
    sect.addEventListener("click", e => selectSect(e.target.dataset.sectId));

    timeLine.appendChild(sect);
  }

  setSectFontSizes();
}

function playArrangementFromClick(e) {
  let rel = (e.pageX - getById("arrangerPlayHeadCon").offsetLeft) / getById("arrangerPlayHeadCon").offsetWidth;

  pm.curPatt = Math.floor(rel / (1 / arrangement.getLength()));

  pm.TogglePlaying(
    ((rel % (1 / arrangement.getLength())) / (1 / arrangement.getLength())),
    true
  ).then();
}

function selectSect(sectId) {
  sectId = parseInt(sectId);
  let sectObjs = getByClass("songSection");

  for (let i = 0; i < sectObjs.length; i++) {
    if (parseInt(sectObjs[i].dataset.sectId) === sectId) {
      sectObjs[i].classList.add("selected");
    } else {
      sectObjs[i].classList.remove("selected");
    }
  }

  selectedSect = sectId;

  let occurences = [];

  for (let p = 0; p < arrangement.structure.length; p++) {
    if (arrangement.structure[p] === sectId) {
      occurences.push(p);
    }
  }

  let highlights = getByClass("sectionHighlight");

  for (let i = 0; i < highlights.length; i++) {
    if (occurences.includes(i)) {
      highlights[i].classList.add("show");
    } else {
      highlights[i].classList.remove("show");
    }
  }

  getById("nameBox").value = arrangement.sections.get(sectId).name;
  getById("lengthSlider").value = arrangement.sections.get(sectId).parts.length;
}

function grabSection(e) {
  grabbing = true;
  origSect = e.target;
  grabStartX = e.clientX - origSect.offsetLeft;

  origSect.classList.remove("songSection");
  origSect.classList.add("hiddenSect");

  floatSect = document.createElement("div");
  floatSect.className = "floatSect";
  floatSect.className += origSect.classList.contains("selected") ? " selected" : "";
  floatSect.style.left = "calc(" + (e.clientX - grabStartX) + "px)";
  floatSect.innerText = origSect.innerText;
  floatSect.style.width = origSect.style.width;
  floatSect.style.fontSize = origSect.style.fontSize;

  timeLine.appendChild(floatSect);
}

function releaseSection(e) {
  mouseDownSection = false;
  if (grabbing) {
    grabbing = false;

    origSect.classList.add("songSection");
    origSect.classList.remove("hiddenSect");

    floatSect.remove();
  }
}

function dragSection(e) {
  if (mouseDownSection && !grabbing) {
    grabSection(e);
  }

  if (grabbing) {
    floatSect.style.left = "calc(" + Math.min(getById("timeLine").offsetWidth - floatSect.offsetWidth, Math.max(0, (e.clientX - grabStartX))) + "px)";

    let sectRelPos = floatSect.offsetLeft / timeLine.offsetWidth;

    let curSect = [...origSect.parentNode.children].indexOf(origSect);

    let leftEdge = arrangement.structure.slice(0, curSect).map(x => arrangement.sections.get(x).parts.length).reduce((x, t) => x + t, 0);

    let beforeLength = curSect > 0 ? arrangement.sections.get(arrangement.structure[curSect - 1]).parts.length : undefined;
    let afterLength = curSect < arrangement.structure.length - 1 ? arrangement.sections.get(arrangement.structure[curSect + 1]).parts.length : undefined;

    if (sectRelPos < (leftEdge - (beforeLength / 2)) / arrangement.getLength()) {
      timeLine.childNodes[curSect - 1].before(timeLine.childNodes[curSect]);
      arrangement.swapSections(curSect, curSect - 1);
      dem.ShowArrangement(arrangement);
      selectSect(selectedSect);
    } else if (sectRelPos > (leftEdge + (afterLength / 2)) / arrangement.getLength()) {
      timeLine.childNodes[curSect].before(timeLine.childNodes[curSect + 1]);
      arrangement.swapSections(curSect, curSect + 1);
      dem.ShowArrangement(arrangement);
      selectSect(selectedSect);
    }
  }
}

function togglePattern(inst, patt) {
  let curVal = 0;
  let relSect = 0;

  let lengths = arrangement.structure.map(x => arrangement.sections.get(x).parts.length);

  for (let i = 0; i < lengths.length; i++) {
    curVal += lengths[i];

    if (patt < curVal) {
      relSect = i;
      break;
    }
  }

  if (arrangement.structure[relSect] === selectedSect) {
    let sectPart = patt - lengths.slice(0, relSect).reduce((t, x) => x + t, 0);

    let partIdx = arrangement.sections.get(arrangement.structure[relSect]).parts[sectPart].indexOf(inst);

    if (partIdx === -1) {
      arrangement.sections.get(arrangement.structure[relSect]).parts[sectPart].push(inst);
    } else {
      arrangement.sections.get(arrangement.structure[relSect]).parts[sectPart].splice(partIdx, 1);
    }

    arrangement.setArrangement();
    dem.ShowArrangement(arrangement);
  }
}

function ChangePatternLength(len) {
  let diff = len - arrangement.sections.get(selectedSect).parts.length;

  if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      arrangement.sections.get(selectedSect).parts.push(arrangement.sections.get(selectedSect).parts[arrangement.sections.get(selectedSect).parts.length - 1]);
    }
  } else if (diff < 0) {
    for (let i = 0; i < -diff; i++) {
      arrangement.sections.get(selectedSect).parts.pop();
    }
  }

  arrangement.setArrangement();
  dem.InitialiseArrangement();
  dem.ShowArrangement(arrangement);

  setUpTimeLine();
  selectSect(selectedSect);
}

function ChangePatternName(nm) {
  let sectObjs = getByClass("songSection");

  arrangement.sections.get(parseInt(sectObjs[selectedSect].dataset.sectId)).name = nm.toUpperCase();

  for (let i = 0; i < sectObjs.length; i++) {
    if (sectObjs[i].dataset.sectId === sectObjs[selectedSect].dataset.sectId) {
      sectObjs[i].innerText = nm;
    }
  }

  setSectFontSizes();
}

function setSectFontSizes() {
  fitText("songSection", 1, 6);
}

window.addEventListener("resize", setSectFontSizes);

async function loadArranger() {
  arrangement = new Arrangement();

  setUpTimeLine();

  await readyStates.waitFor("demLoad");

  getById("playBar").removeEventListener("click", playFromClick);
  getById("playBar").addEventListener("click", playArrangementFromClick);

  window.addEventListener("mousemove", dragSection);
  window.addEventListener("mouseup", releaseSection);

  timeLine = getById("timeLine");

  dem.InitialiseArrangement();
  dem.ShowArrangement(arrangement);

  selectSect(getByClass("songSection")[0].dataset.sectId);
}