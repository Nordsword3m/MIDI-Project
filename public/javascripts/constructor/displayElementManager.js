const numOfDivs = 32;

// Page Elements
let display;
let divisionDisplay;
let chordNoteCon;

function DisplayElementManager() {
  this.displays = {}
  this.displays[ch] = new DrumDisplay(getById("chDisp"), new Array(256));
  this.displays[kick] = new DrumDisplay(getById("kickDisp"), new Array(256));
  this.displays[snr] = new DrumDisplay(getById("snareDisp"), new Array(256));
  this.displays[perc] = new DrumDisplay(getById("percDisp"), new Array(256));

  display = getById("display");
  divisionDisplay = getById("divDisp");
  chordNoteCon = getById("chordNoteCon");
}

class DrumDisplay {
  constructor(disp, notesElems) {
    this.disp = disp;
    this.noteObjs = notesElems;
  }
}

DisplayElementManager.prototype.GetFromScale = function (scale, num) {
  let scaleNotes = scale === "major" ? majorScale : minorScale;
  num = num - 1;

  return (Math.floor(num / 7) * 12) + scaleNotes[num % 7];
}

DisplayElementManager.prototype.PlaceChordProgression = function (progression) {
  let chordObjs = [];
  let pos = 0;
  for (let c = 0; c < progression.chords.length; c++) {
    chordObjs.push([]);
    for (let n = 0; n < progression.chords[c].length; n++) {
      let note = progression.chords[c][n];
      let noteObj = this.PlaceChordNote(note.num, pos, note.length);
      if (note.root) {
        noteObj.classList.add("root");
      }
      chordObjs[c].push(noteObj);
    }
    pos += progression.lengths[c];
  }
  return chordObjs;
}

DisplayElementManager.prototype.PlaceChordNote = function (num, start, length) {
  let note = document.createElement("div");
  note.className = "chordNote";
  
  note.dataset.root = num;
  note.dataset.start = start;
  note.dataset.length = length;

  note.style.width = "calc(" + length + " * 12.5%)";
  note.style.left = "calc(" + start + " * 12.5%)";
  note.style.bottom = "calc(" + (num - 1 + 24) + " * 100% / 60)";


  chordNoteCon.appendChild(note);
  return note;
}

DisplayElementManager.prototype.InitialiseDrumNotes = function () {
  for (let i = 0; i < 256; i++) {
    this.displays[ch].noteObjs[i] = this.CreateDrumNote(i, ch);
    this.displays[kick].noteObjs[i] = this.CreateDrumNote(i, kick);

    if (i % 2 === 0) {
      if ((i / (256 * noteLength)) % 1 === 0) {
        if ((i / (256 * barLength)) % 1 !== 0) {
          this.displays[snr].noteObjs[i] = this.CreateDrumNote(i, snr);
        }
      }
      this.displays[perc].noteObjs[i] = this.CreateDrumNote(i, perc);
    }
  }
};

DisplayElementManager.prototype.PlaceDrumNote = function (note) {
  note.style.left =
    (100 * parseInt(note.id.slice(note.id.indexOf("Note") + 4)) / 256) + "%";

};

DisplayElementManager.prototype.CreateDivisions = function () {
  for (let i = 1; i < numOfDivs; i++) {
    this.CreateDivision(i);
  }
};

DisplayElementManager.prototype.CreateDrumNote = function (id, dispId) {
  let note = document.createElement("div");
  let type = dispId === kick ? "kick" : dispId === ch ? "ch" : dispId === snr ? "snr" : dispId === perc ? "perc" : "";

  note.id = type + "Note" + id;
  note.className = "note";

  this.PlaceDrumNote(note);

  this.displays[dispId].disp.appendChild(note);
  return note;
};

DisplayElementManager.prototype.Display = function (id, noteData) {
  for (let i = 0; i < 256; i++) {
    let noteObj = this.displays[id].noteObjs[i]
    if (noteObj && !noteObj.classList.contains("ghost")) {
      if (noteData[i] === 0) {
        noteObj.classList.remove("visible");
      } else {
        noteObj.classList.add("visible");
      }
    }
  }
};

DisplayElementManager.prototype.CreateDivision = function (loc) {
  let div = document.createElement("div");

  div.className = "division";
  div.id = "div" + loc;
  div.style.opacity = "" + (loc % 4 === 0 ? 1 : 0.3);
  div.style.left = (loc / numOfDivs) * 100 + "%";

  divisionDisplay.appendChild(div);
};
