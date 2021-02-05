// Page Elements
let display;
let divisionDisplay;
let chordNoteCon;
let bassNoteCon;
let meloNoteCon;

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

DisplayElementManager.prototype.CreateDragNote = function (start, num, length) {
  let note = document.createElement("div");
  note.className = "note melo";

  note.style.left = "calc(" + start + " * 12.5%)";
  note.style.width = "calc(" + length + " * 12.5%)";
  note.style.bottom = "calc(" + (num - 1 - 13) + " * 100% / var(--meloNoteAmt))";

  meloNoteCon.appendChild(note);
  return note;
};

DisplayElementManager.prototype.PlaceMelodyGhost = function (start, num) {
  let ghost = document.createElement("div");
  ghost.className = "note melo draw";


  ghost.style.left = "calc(" + start + " * 12.5%)";
  ghost.style.width = "calc(" + (8 - start) + " * 12.5%)";
  ghost.style.bottom = "calc(" + (num - 1 - 13) + " * 100% / var(--meloNoteAmt))";

  ghost.addEventListener("mousedown", (e) => StartNotePaint(num, e));
  ;

  meloNoteCon.appendChild(ghost);
  return ghost;
};

DisplayElementManager.prototype.PlaceMelody = function (melo) {
  let meloNoteObjs = [];
  let pos = 0;

  meloNoteCon.textContent = "";

  for (let n = 0; n < melo.notes.length; n++) {
    let note = document.createElement("div");
    note.className = "note melo";


    note.style.left = "calc(" + pos + " * 12.5%)";
    note.style.width = "calc(" + melo.notes[n].length + " * 12.5%)";
    note.style.bottom = "calc(" + (melo.notes[n].num - 1 - 12) + " * 100% / var(--meloNoteAmt))";

    pos += melo.notes[n].length;

    meloNoteCon.appendChild(note);
    meloNoteObjs.push(note);
  }

  return meloNoteObjs;
};

DisplayElementManager.prototype.PlaceBassLine = function (bLine) {
  let bassNoteObjs = [];
  let pos = 0;

  bassNoteCon.textContent = "";

  for (let n = 0; n < bLine.notes.length; n++) {
    let note = document.createElement("div");
    note.className = "note bass";


    note.style.left = "calc(" + pos + " * 12.5%)";
    note.style.width = "calc(" + bLine.notes[n].length + " * 12.5%)";
    note.style.bottom = "calc(" + (bLine.notes[n].num - 1 + 24) + " * 100% / var(--bassNoteAmt))";

    pos += bLine.notes[n].length;

    bassNoteCon.appendChild(note);
    bassNoteObjs.push(note);
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
