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
    this.structure = ["intro", "chorus", "verse 1", "chorus", "verse 2", "chorus", "chorus", "outro"];
    this.sections = new Map();

    this.sections.set("intro", [["chords"],
      ["chords", "ch"]]);

    this.sections.set("chorus", [["chords", "melo", "bass", "kick", "snare", "ch", "perc"]]);

    this.sections.set("verse 1", [["chords", "bass", "kick", "snare", "ch"],
      ["chords", "bass", "kick", "snare", "ch", "perc"]]);

    this.sections.set("verse 2", [["chords", "melo", "bass", "kick"],
      ["chords", "melo", "bass", "kick", "ch"]]);

    this.sections.set("outro", [["chords", "bass", "kick", "ch"],
      ["chords", "ch"]]);

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
      let curSect = this.sections.get(this.structure[s]);
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

    let length = arrangement.sections.get(arrangement.structure[s]).length;

    sect.className = "songSection";
    sect.style.width = "calc(100% * " + length + " / var(--patternAmt))";
    sect.innerText = arrangement.structure[s];

    sect.style.fontSize = "calc(" + (length * 0.7) + " * 1vw + 0.7vw)";

    timeLine.appendChild(sect);
  }
}

function playArrangementFromClick(e) {
  pm.curPatt = Math.floor((e.layerX / e.target.offsetWidth) / (1 / arrangement.getLength()));

  pm.TogglePlaying(
    (((e.layerX / e.target.offsetWidth) % (1 / arrangement.getLength())) / (1 / arrangement.getLength())),
    true
  ).then();
}

function selectSect(sect) {

  if (selectedSect !== undefined) {
    selectedSect.classList.remove("selected");
  }

  selectedSect = sect;
  selectedSect.classList.add("selected");

  let sectHighlight = getById("sectionHighlight");

  let sectIdx = [...getById("timeLine").childNodes].indexOf(sect);

  sectHighlight.style.left = "calc(" + (100 * arrangement.structure.slice(0, sectIdx).map(x => arrangement.sections.get(x).length).reduce((x, t) => x + t, 0) / arrangement.getLength()) + "%)";
  sectHighlight.style.width = "calc(" + (100 * arrangement.sections.get(arrangement.structure[sectIdx]).length / arrangement.getLength()) + "%)";
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

    let leftEdge = arrangement.structure.slice(0, curSect).map(x => arrangement.sections.get(x).length).reduce((x, t) => x + t, 0);

    let beforeLength = curSect > 0 ? arrangement.sections.get(arrangement.structure[curSect - 1]).length : undefined;
    let afterLength = curSect < arrangement.structure.length - 1 ? arrangement.sections.get(arrangement.structure[curSect + 1]).length : undefined;

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

  getById("arrangerPlayHeadCon").addEventListener("click", playArrangementFromClick);

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