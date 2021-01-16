const numOfDivs = 32;

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

window.addEventListener("resize", function () {
  for (let i = 0; i < 256; i++) {
    for (let inst in this.displays) {
      this.PlaceNote(inst.noteObjs[i]);
    }
  }
});

DisplayElementManager.prototype.InitialiseDrumNotes = function () {
  for (let i = 0; i < 256; i++) {
    this.displays[ch].noteObjs[i] = this.CreateNote(i, ch);
    this.displays[kick].noteObjs[i] = this.CreateNote(i, kick);

    if (i % 2 === 0) {
      if ((i / (256 * noteLength)) % 1 === 0) {
        if ((i / (256 * barLength)) % 1 !== 0) {
          this.displays[snr].noteObjs[i] = this.CreateNote(i, snr);
        }
      }
      this.displays[perc].noteObjs[i] = this.CreateNote(i, perc);
    }
  }
};

DisplayElementManager.prototype.PlaceNote = function (note) {
  note.style.left =
    (100 * parseInt(note.id.slice(note.id.indexOf("Note") + 4)) / 256) + "%";

};

DisplayElementManager.prototype.CreateDivisions = function () {
  for (let i = 1; i < numOfDivs; i++) {
    this.CreateDivision(i);
  }
};

DisplayElementManager.prototype.CreateNote = function (id, dispId) {
  let note = document.createElement("div");
  let type = dispId === kick ? "kick" : dispId === ch ? "ch" : dispId === snr ? "snr" : dispId === perc ? "perc" : "";

  note.id = type + "Note" + id;
  note.className = "note";

  this.PlaceNote(note);

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
