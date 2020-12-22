function DisplayElementManager() {}

window.addEventListener("resize", function () {
  for (let i = 0; i < 256; i++) {
    dem.PlaceNote(notes[ch][i], hihatDisplay);
    dem.PlaceNote(notes[kick][i], kickDisplay);
    dem.PlaceNote(notes[snr][i], snareDisplay);
    dem.PlaceNote(notes[perc][i], percDisplay);
  }
});

DisplayElementManager.prototype.InitialiseNotes = function () {
  let chNotes = new Array(256);
  let kickNotes = new Array(256);
  let snrNotes = new Array(256);
  let percNotes = new Array(256);

  for (let i = 0; i < 256; i++) {
    chNotes[i] = this.CreateNote(i, "ch", hihatDisplay);
    kickNotes[i] = this.CreateNote(i, "kick", kickDisplay);

    if (i % 2 === 0) {
      if ((i / (256 * noteLength)) % 1 === 0) {
        if ((i / (256 * barLength)) % 1 !== 0) {
          snrNotes[i] = this.CreateNote(i, "snr", snareDisplay);
        }
      }

      percNotes[i] = this.CreateNote(i, "perc", percDisplay);
    }
  }

  return [chNotes, snrNotes, kickNotes, percNotes];
};

DisplayElementManager.prototype.PlaceNote = function (note, disp) {
  if (note) {
    note.style.left =
      (parseInt(note.id.substring(note.id.search("Note") + 4)) / 256) *
        disp.offsetWidth +
      disp.offsetLeft +
      "px";
  }
};

DisplayElementManager.prototype.CreateDivisions = function () {
  for (let i = 1; i < numOfDivs; i++) {
    this.CreateDivision(i);
  }
};

DisplayElementManager.prototype.CreateNote = function (id, type, disp) {
  let note = document.createElement("div");

  note.id = type + "Note" + id;
  note.className = "note";

  this.PlaceNote(note, disp);

  disp.appendChild(note);
  return note;
};

DisplayElementManager.prototype.Display = function (noteData, noteObjs) {
  for (let i = 0; i < 256; i++) {
    if (noteObjs[i] && !noteObjs[i].classList.contains("ghost")) {
      if (noteData[i] === 0) {
        noteObjs[i].classList.remove("visible");
      } else {
        noteObjs[i].classList.add("visible");
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
