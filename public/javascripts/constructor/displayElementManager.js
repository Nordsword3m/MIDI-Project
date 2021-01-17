const numOfDivs = 32;

const majorScale = [1, 3, 5, 6, 8, 10, 12];
const minorScale = [1, 3, 4, 6, 8, 9, 11];

// Page Elements
let display;
let divisionDisplay;

function DisplayElementManager() {
  this.displays = {}
  this.displays[ch] = new InstrumentDisplay(getById("chDisp"), new Array(256));
  this.displays[kick] = new InstrumentDisplay(getById("kickDisp"), new Array(256));
  this.displays[snr] = new InstrumentDisplay(getById("snareDisp"), new Array(256));
  this.displays[perc] = new InstrumentDisplay(getById("percDisp"), new Array(256));

  display = getById("display");
  divisionDisplay = getById("divDisp");
}

class InstrumentDisplay {
  constructor(disp, notesElems) {
    this.disp = disp;
    this.noteObjs = notesElems;
  }
}

function getFromScale(scale, num) {
  let scaleNotes = scale === "major" ? majorScale : minorScale;
  num = num - 1;


  return (Math.floor(num / 7) * 12) + scaleNotes[num % 7];
}

DisplayElementManager.prototype.PlaceChordProgression = function (type, maxSpread, chords, lengths, degrees) {
  let pos = 0;
  let prevChord = [];

  for (let c = 0; c < chords.length; c++) {
    let inversion = 0;

    if (c > 0) {
      let prevBot = prevChord[0].dataset.noteNum;
      let prevTop = prevChord[prevChord.length - 1].dataset.noteNum;

      for (let n = degrees[c] - 1; n >= 0; n--) {
        let curNote = getFromScale(type, chords[c] + 2 * n);
        let topDist = Math.abs(curNote - getFromScale(type, chords[0] + 2 * (degrees[c] - 1)));
        let botDist = Math.abs(curNote - getFromScale(type, chords[0]));

        if (botDist - 12 > 12 * maxSpread) {
          inversion--;
        } else if (topDist - 12 > 12 * maxSpread) {
          inversion++;
        }
      }
    }
    prevChord = this.PlaceChord(type, chords[c], pos, lengths[c], degrees[c], inversion).sort((a, b) => a.dataset.noteNum - b.dataset.noteNum);
    pos += lengths[c];
  }
}

DisplayElementManager.prototype.PlaceChord = function (type, num, start, length, degree, inversion) {
  let notes = [];

  for (let n = 0; n < degree; n++) {
    let invert = 0;

    if (inversion > 0) {
      if (n < inversion) {
        invert = 12;
      }
    } else if (inversion < 0) {
      if (n >= degree + inversion) {
        invert = -12;
      }
    }

    notes.push(this.PlaceChordNote(getFromScale(type, num + 2 * n) + invert, start, length));
  }
  notes[0].classList.add("root");
  return notes;
}

DisplayElementManager.prototype.PlaceChordNote = function (noteNum, start, length) {
  let note = document.createElement("div");
  note.className = "chordNote";

  note.dataset.noteNum = noteNum;
  note.dataset.start = start;
  note.dataset.length = length;

  note.style.width = "calc(" + length + " * 12.5%)";
  note.style.bottom = "calc(" + (noteNum - 1) + " * var(--noteHeight))";
  note.style.left = "calc(" + start + " * 12.5%)";

  display.appendChild(note);
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
