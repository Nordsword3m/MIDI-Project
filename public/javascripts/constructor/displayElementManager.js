// Page Elements
let display;
let divisionDisplay;
let chordNoteCon;
let bassNoteCon;
let meloNoteCon;

let meloNoteId = 0;

function DisplayElementManager() {
  this.displays = {};
  this.displays.ch = new DrumDisplay(getById("chDisp"), new Array(256));
  this.displays.kick = new DrumDisplay(getById("kickDisp"), new Array(256));
  this.displays.snr = new DrumDisplay(getById("snareDisp"), new Array(256));
  this.displays.perc = new DrumDisplay(getById("percDisp"), new Array(256));

  display = getById("display");
  divisionDisplay = getById("divDisp");
  chordNoteCon = getById("chordNoteCon");
  bassNoteCon = getById("bassNoteCon");
  meloNoteCon = getById("meloNoteCon");
}

class DrumDisplay {
  constructor(disp, notesElems) {
    this.disp = disp;
    this.noteObjs = notesElems;
  }
}

DisplayElementManager.prototype.InitialiseArrangement = function () {
  document.querySelectorAll(".patternDisplay").forEach((x) => x.textContent = "");

  let patternAmt = arrangement.getLength();

  let insts = Object.keys(arrangement.arr);

  for (let p = 0; p < patternAmt; p++) {

    insts.forEach((i) => {
      let patt = document.createElement("div");

      patt.className = "pattern " + i;
      patt.style.left = "calc(100% * " + (p / patternAmt) + ")";

      patt.addEventListener("mousedown", () => {
        togglePattern(i, p);
      });
      patt.addEventListener("mouseenter", () => {
        if (mouseLeftDown) {
          togglePattern(i, p);
        }
      });

      getById(i + "PattDisplay").appendChild(patt);
    });
  }
};

DisplayElementManager.prototype.ShowArrangement = function (arrangement) {
  let patternAmt = arrangement.getLength();

  let insts = Object.keys(arrangement.arr);

  let lengths = arrangement.structure.map(x => arrangement.sections.get(x).parts.length);
  let curSect = 0;
  let curLength = 0;

  let prevSect;
  document.querySelectorAll(".sectionHighlight").forEach((e) => e.remove());

  for (let p = 0; p < patternAmt; p++) {
    if (p >= curLength + lengths[curSect]) {
      curLength += lengths[curSect];
      curSect++;
    }

    if (prevSect !== curSect) {
      let sectHighlight = document.createElement("div");
      sectHighlight.className = "sectionHighlight";
      sectHighlight.className += arrangement.structure[curSect] === selectedSect ? " show" : "";
      sectHighlight.style.left = "calc(100% * " + (p / patternAmt) + ")";
      sectHighlight.style.width = "calc(100% * " + (lengths[curSect] / patternAmt) + ")";

      getById("arrangerPlayHeadCon").appendChild(sectHighlight);

      prevSect = curSect;
    }

    insts.forEach((i) => {
      getById(i + "PattDisplay").children[p].style.opacity = arrangement.arr[i][p] ? "1" : "0";
    });
  }
};

DisplayElementManager.prototype.PlaceMelodyGhost = function (scale, num) {
  let ghostCon = document.createElement("div");
  ghostCon.className = "ghostCon";
  ghostCon.dataset.num = num;
  ghostCon.style.bottom = "calc(" + (getFromScale(progression.type, num) - 1 - 12) + " * 100% / var(--meloNoteAmt))";

  ghostCon.addEventListener("mousedown", (e) => {
    if (e.button === 2) {
      PreviewNote(num);
    }
  });

  ghostCon.addEventListener("mousedown", (e) => StartNotePaint(e, num));

  meloNoteCon.appendChild(ghostCon);
  return ghostCon;
};

DisplayElementManager.prototype.CreateMeloNote = function (start, num, length) {
  let note = document.createElement("div");
  note.className = "note melo drawing";

  note.style.left = "calc(" + start + " * 12.5%)";
  note.style.width = "calc(" + length + " * 12.5%)";
  note.style.bottom = "calc(" + (getFromScale(progression.type, num) - 1 - 12) + " * 100% / var(--meloNoteAmt))";

  note.id = "meloNote" + meloNoteId;
  meloNoteId++;

  note.addEventListener("mousemove", noteHover);
  note.addEventListener("mouseleave", noteMouseLeave);
  note.addEventListener("mouseenter", noteMouseEnter);
  note.addEventListener("mousedown", notePress);

  meloNoteCon.appendChild(note);
  return note;
};

DisplayElementManager.prototype.PlaceMelody = function (melo) {
  meloNoteCon.querySelectorAll(".note").forEach((e) => e.remove());

  for (let i = 0; i < melo.length; i++) {
    for (let n = 0; n < melo[i].length; n++) {
      let note = this.CreateMeloNote(8 * i / 256, melo[i][n].num, melo[i][n].length);
      note.classList.remove("drawing");
      noteRefs.set(note.id, melo[i][n]);
    }
  }
};

DisplayElementManager.prototype.PlaceBassLine = function (bLine) {
  let bassNoteObjs = [];

  bassNoteCon.textContent = "";

  for (let i = 0; i < bLine.length; i++) {
    if (bLine[i]) {
      let note = document.createElement("div");
      note.className = "note bass";

      note.style.left = "calc(" + i / 256 + " * 100%)";
      note.style.width = "calc(" + bLine[i].length + " * 12.5%)";
      note.style.bottom = "calc(" + (bLine[i].num - 1 + 24) + " * 100% / var(--bassNoteAmt))";

      bassNoteCon.appendChild(note);
      bassNoteObjs.push(note);
    }
  }

  return bassNoteObjs;
};

DisplayElementManager.prototype.PlaceChordProgression = function (progression) {
  let chordObjs = [];
  let pos = 0;
  for (let c = 0; c < progression.chords.length; c++) {
    chordObjs.push([]);
    for (let n = 0; n < progression.chords[c].length; n++) {
      let note = progression.chords[c][n];
      let noteObj = this.PlaceChordNote(note.num, pos, note.length, note.startOffset);
      if (note.isRoot) {
        noteObj.classList.add("root");
      }
      chordObjs[c].push(noteObj);
    }
    pos += progression.lengths[c];
  }
  return chordObjs;
};

DisplayElementManager.prototype.PlaceChordNote = function (num, start, length, startOffset) {
  let note = document.createElement("div");
  note.className = "note chords";

  note.style.width = "calc(" + (length - startOffset) + " * 12.5%)";
  note.style.left = "calc(" + (start + startOffset) + " * 12.5%)";
  note.style.bottom = "calc(" + (num - 1 + 24) + " * 100% / var(--chordNoteAmt))";


  chordNoteCon.appendChild(note);
  return note;
};

DisplayElementManager.prototype.InitialiseDrumNotes = function () {
  for (let i = 0; i < 256; i++) {
    this.displays.ch.noteObjs[i] = this.CreateDrumNote(i, "ch");
    this.displays.kick.noteObjs[i] = this.CreateDrumNote(i, "kick");

    if (i % 2 === 0) {
      if ((i / (256 * noteLength)) % 1 === 0) {
        if ((i / (256 * barLength)) % 1 !== 0) {
          this.displays.snr.noteObjs[i] = this.CreateDrumNote(i, "snr");
        }
      }
      this.displays.perc.noteObjs[i] = this.CreateDrumNote(i, "perc");
    }
  }
};

DisplayElementManager.prototype.PlaceDrumNote = function (note) {
  note.style.left =
    (100 * parseInt(note.id.slice(note.id.indexOf("Note") + 4)) / 256) + "%";
};

DisplayElementManager.prototype.CreateDrumNote = function (id, dispId) {
  let note = document.createElement("div");

  note.id = dispId + "Note" + id;
  note.className = "note drum invisible";

  this.PlaceDrumNote(note);

  this.displays[dispId].disp.appendChild(note);
  return note;
};

DisplayElementManager.prototype.Display = function (id, noteData) {
  for (let i = 0; i < 256; i++) {
    let noteObj = this.displays[id].noteObjs[i];
    if (noteObj && !noteObj.classList.contains("ghost")) {
      if (noteData[i] === 0) {
        noteObj.classList.add("invisible");
      } else {
        noteObj.classList.remove("invisible");
      }
    }
  }
};
