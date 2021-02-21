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
      parts: [["chords", "melo", "bass", "kick", "snare", "ch", "perc"], ["chords", "melo", "bass", "kick", "snare", "ch", "perc"]]
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
    return Object.values(this.arr).map(x => x.length).reduce((x, p) => Math.max(p, x));
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

  for (let s = 0; s < arrangement.structure.length; s++) {
    let sect = document.createElement("div");

    let length = arrangement.sections.get(arrangement.structure[s]).parts.length;

    sect.className = "songSection";
    sect.style.width = "calc(100% * " + length + " / var(--patternAmt))";
    sect.innerText = arrangement.sections.get(arrangement.structure[s]).name;
    sect.dataset.sectId = arrangement.structure[s];

    sect.style.fontSize = "calc(" + (length * 0.7) + " * 1vw + 0.7vw)";

    timeLine.appendChild(sect);
  }
}

function playArrangementFromClick(e) {
  let rel = (e.pageX - getById("arrangerPlayHeadCon").offsetLeft) / getById("arrangerPlayHeadCon").offsetWidth;

  pm.curPatt = Math.floor(rel / (1 / arrangement.getLength()));

  pm.TogglePlaying(
    ((rel % (1 / arrangement.getLength())) / (1 / arrangement.getLength())),
    true
  ).then();
}

function selectSect(sect) {
  if (selectedSect !== undefined) {
    selectedSect.classList.remove("selected");
  }

  selectedSect = sect;
  selectedSect.classList.add("selected");

  let sectId = parseInt(sect.dataset.sectId);

  let oldHighlights = getByClass("sectionHighlight");

  for (let i = oldHighlights.length - 1; i >= 0; i--) {
    oldHighlights[i].remove();
  }

  let occurences = [];

  for (let p = 0; p < arrangement.structure.length; p++) {
    if (arrangement.structure[p] === sectId) {
      occurences.push(p);
    }
  }

  //console.log(occurences);

  for (let i = 0; i < occurences.length; i++) {
    let sectHighlight = document.createElement("div");
    sectHighlight.className = "sectionHighlight";

    sectHighlight.style.left = "calc(" + (100 * arrangement.structure.slice(0, occurences[i]).map(x => arrangement.sections.get(x).parts.length).reduce((x, t) => x + t, 0) / arrangement.getLength()) + "%)";
    sectHighlight.style.width = "calc(" + (100 * arrangement.sections.get(arrangement.structure[occurences[i]]).parts.length / arrangement.getLength()) + "%)";

    getById("arrangerPlayHeadCon").appendChild(sectHighlight);
    
  }

  getById("nameBox").value = arrangement.sections.get(parseInt(selectedSect.dataset.sectId)).name;
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
      dem.PlaceArrangement(arrangement);
      selectSect(selectedSect);
    } else if (sectRelPos > (leftEdge + (afterLength / 2)) / arrangement.getLength()) {
      timeLine.childNodes[curSect].before(timeLine.childNodes[curSect + 1]);
      arrangement.swapSections(curSect, curSect + 1);
      dem.PlaceArrangement(arrangement);
      selectSect(selectedSect);
    }
  }
}

async function loadArranger() {
  arrangement = new Arrangement();

  setUpTimeLine();

  await readyStates.waitFor("demLoad");

  getById("playBar").removeEventListener("click", playFromClick);
  getById("playBar").addEventListener("click", playArrangementFromClick);

  getById("nameBox").addEventListener("input", (e) => {
    arrangement.sections.get(parseInt(selectedSect.dataset.sectId)).name = e.target.value.toUpperCase();

    let sectObjs = getByClass("songSection");
    for (let i = 0; i < sectObjs.length; i++) {
      if (sectObjs[i].dataset.sectId === selectedSect.dataset.sectId) {
        sectObjs[i].innerText = e.target.value;
      }
    }

  });

  let sectObjs = getByClass("songSection");

  selectSect(sectObjs[0]);

  for (let i = 0; i < sectObjs.length; i++) {
    sectObjs[i].addEventListener("mousedown", () => mouseDownSection = true);
    sectObjs[i].addEventListener("click", e => selectSect(e.target));
  }

  window.addEventListener("mousemove", dragSection);
  window.addEventListener("mouseup", releaseSection);

  timeLine = getById("timeLine");

  dem.PlaceArrangement(arrangement);
}