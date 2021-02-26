let melody;

let noteRefs = new Map();

let painting = false;
let paintStart = 0;
let paintNum;
let paintNote;

let dragging = false;
let dragStart;
let dragNote;
let dragNoteStart;
let dragNoteLength;
let endHover = false;

let ghosts = [];

let erasing = false;

class Melody {
  constructor(sched) {
    if (sched) {
      this.schedule = sched;
    } else {
      this.schedule = new Array(256);
      for (let i = 0; i < 256; i++) {
        this.schedule[i] = [];
      }
    }

  }

  addNote(note, pos) {
    this.schedule[(pos / 8) * 256].push(note);
    saveMelody();
  }

  moveNote(note, pos) {
    for (let i = 0; i < this.schedule.length; i++) {
      if (this.schedule[i].includes(note)) {
        this.schedule[i].splice(this.schedule[i].indexOf(note), 1);
        break;
      }
    }

    this.schedule[pos].push(note);
    saveMelody();
  }

  setNoteLength(note, length) {
    for (let i = 0; i < this.schedule.length; i++) {
      if (this.schedule[i].includes(note)) {
        this.schedule[i][this.schedule[i].indexOf(note)].length = length;
        break;
      }
    }
    saveMelody();
  }

  deleteNote(note) {
    for (let i = 0; i < this.schedule.length; i++) {
      if (this.schedule[i].includes(note)) {
        this.schedule[i].splice(this.schedule[i].indexOf(note), 1);
        break;
      }
    }
    saveMelody();
  }

  double() {
    let latest = 0;

    for (let p = 0; p < this.schedule.length; p++) {
      if (this.schedule[p].length > 0) {
        for (let n = 0; n < this.schedule[p].length; n++) {
          latest = Math.max(latest, p / 32 + this.schedule[p][n].length);
        }
      }
    }

    let extent = 256 * Math.max(1, Math.pow(2, Math.ceil(Math.log2(latest)))) / 8;

    for (let p = 0; p < extent; p++) {
      this.schedule[p + extent] = JSON.parse(JSON.stringify(this.schedule[p]));
    }

    saveMelody();
  }

  legato() {
    let noteStart = undefined;
    for (let p = 0; p < this.schedule.length; p++) {
      if (this.schedule[p].length > 0) {
        if (noteStart !== undefined) {
          for (let n = 0; n < this.schedule[noteStart].length; n++) {
            this.schedule[noteStart][n].length = 8 * (p - noteStart) / 256;
          }
        }
        noteStart = p;
      }
    }

    saveMelody();
  }

  staccato() {
    for (let p = 0; p < this.schedule.length; p++) {
      if (this.schedule[p].length > 0) {
        for (let n = 0; n < this.schedule[p].length; n++) {
          this.schedule[p][n].length = 1 / 8;
        }
      }

    }

    saveMelody();
  }
}

function saveMelody() {
  sessionStorage.setItem("melody", JSON.stringify(melody.schedule));
}

function ShowGhosts(noteNums, pos) {
  let ghosts = [];

  for (let n = 0; n < noteNums.length; n++) {
    ghosts.push(dem.PlaceMelodyGhost(pos, noteNums[n]));
  }

  return ghosts;
}

function SetupScaleNotes() {
  let possib = [];
  let noteRange = new NumRange(13, 48);

  let start;
  for (start = 0; start < 30; start++) {
    if (getFromScale(progression.type, start) === noteRange.min) {
      break;
    }
  }

  let curNote = start;

  while (getFromScale(progression.type, curNote) <= noteRange.max) {
    possib.push(getFromScale(progression.type, curNote));
    curNote++;
  }

  ghosts = ShowGhosts(possib, 0);
}

function GetPaintLength(pageX) {
  let mousePos = pageX / $(document).width();
  return Math.round(Math.max(1 / 8, (mousePos * 8) - paintStart) * 8) / 8;
}

function StartNotePaint(e, num) {
  if (e.button === 0) {
    PreviewNote(num);
    paintNum = num;
    painting = true;
    paintStart = Math.floor(Math.max((e.pageX / $(document).width()) * 8, 0) * 8) / 8;

    paintNote = dem.CreateMeloNote(paintStart, num, 1 / 8);
  }
}

function UpdatePaintNote(e) {
  if (painting) {
    if (e.target.classList && e.target.classList.contains("ghostCon")) {
      if (paintNote.style.bottom !== e.target.style.bottom) {
        paintNote.style.bottom = e.target.style.bottom;
        paintNum = e.target.dataset.num;
        PreviewNote(e.target.dataset.num, true);
      }
    }
  }
}

function UpdatePaintLength(e) {
  if (painting) {
    paintNote.style.width = "calc(" + GetPaintLength(e.pageX) + " * 12.5%)";
  }
}

function StopNotePaint(e) {
  paintNote.classList.remove("drawing");

  let newNote = new Note(paintNum, GetPaintLength(e.pageX));

  melody.addNote(newNote, paintStart);
  noteRefs.set(paintNote.id, newNote);
  painting = false;
  paintNote = null;
}

function PreviewNote(num, moveOverride) {
  if ((!painting && !dragging || moveOverride) && !pm.playing) {
    am.playNoteNow(numToPitch(num, progression.keyNum), "piano");
  }
}

function noteHover(e) {
  if (!painting && !dragging) {
    let pos = e.clientX - e.target.getBoundingClientRect().left;

    if (e.target.offsetWidth - pos <= window.innerWidth / 100) {
      e.target.classList.add("endSelect");
      endHover = true;
    } else {
      e.target.classList.remove("endSelect");
      endHover = false;
    }
  }
}

function deleteNote(n) {
  melody.deleteNote(noteRefs.get(n.id));
  n.remove();
}

function noteMouseEnter(e) {
  if (erasing) {
    deleteNote(e.target);
  } else {
    if (!painting) {
      PreviewNote(noteRefs.get(e.target.id).num);
    }
  }
}

function mouseUp(e) {
  if (e.button === 0) {
    if (painting) {
      StopNotePaint(e);
    } else if (dragging) {
      noteRelease(e);
    }
  } else if (e.button === 2) {
    erasing = false;
  }
}

function mouseMove(e) {
  if (painting) {
    UpdatePaintLength(e);
    UpdatePaintNote(e);
  } else if (dragging) {
    if (!endHover) {
      shiftNote(e);
      transposeNote(e);
    } else {
      changeNoteLength(e);
    }
  }
}

function mouseDown(e) {
  if (e.button === 2) {
    erasing = true;

    if (e.target.classList.contains("note")) {
      deleteNote(e.target);
    }
  }
}

function changeNoteLength(e) {
  let dragDelta = 100 * (Math.ceil(((e.clientX / $(document).width()) - dragStart / 100) * 64) / 64);

  let newLength = Math.max(100 / 64, parseFloat(dragNoteLength) + dragDelta);

  if (dragNote.style.width !== "calc(" + newLength + "%)") {
    let newNoteLength = 8 * newLength / 100;
    melody.setNoteLength(noteRefs.get(dragNote.id), newNoteLength);
  }

  dragNote.style.width = "calc(" + newLength + "%)";
}

function transposeNote(e) {
  if (e.target.classList && e.target.classList.contains("ghostCon")) {
    if (dragNote.style.bottom !== e.target.style.bottom) {
      dragNote.style.bottom = e.target.style.bottom;
      noteRefs.get(dragNote.id).num = e.target.dataset.num;
      PreviewNote(e.target.dataset.num, true);
    }
  }
}

function shiftNote(e) {
  let dragDelta = 100 * (Math.floor(((e.clientX / $(document).width()) - dragStart / 100) * 64) / 64);

  let newPos = Math.min((100 - 100 / 64), Math.max(0, parseFloat(dragNoteStart) + dragDelta));

  if (dragNote.style.left !== "calc(" + newPos + "%)") {
    let newSchedPos = 256 * newPos / 100;

    melody.moveNote(noteRefs.get(dragNote.id), newSchedPos);
  }

  dragNote.style.left = "calc(" + newPos + "%)";
}

function noteRelease() {
  if (dragging) {
    dragging = false;

    let noteLength = dragNote.style.width.substring(5, dragNote.style.left.length - 2);
    let noteStart = dragNote.style.left.substring(5, dragNote.style.left.length - 2);

    if (parseFloat(noteLength) + parseFloat(noteStart) > 100) {
      let newLength = 100 - noteStart;

      let newNoteLength = 8 * newLength / 100;

      melody.setNoteLength(noteRefs.get(dragNote.id), newNoteLength);

      dragNote.style.width = "calc(" + newLength + "%)";
    }
  }
}

function notePress(e) {
  if (e.button === 0) {
    PreviewNote(noteRefs.get(e.target.id).num);
    dragging = true;
    dragNote = e.target;
    dragStart = 100 * e.clientX / $(document).width();
    dragNoteStart = dragNote.style.left.substring(5, dragNote.style.left.length - 2);
    dragNoteLength = dragNote.style.width.substring(5, dragNote.style.width.length - 2);
  }
}

function noteMouseLeave(e) {
  e.target.classList.remove("endSelect");
}

function staccatoMelo() {
  melody.staccato();
  dem.PlaceMelody(melody.schedule);
}

function legatoMelo() {
  melody.legato();
  dem.PlaceMelody(melody.schedule);
}

function doubleMelo() {
  melody.double();
  dem.PlaceMelody(melody.schedule);
}

async function loadMeloBuilder() {
  readyStates.declarePresence("melo");

  await readyStates.waitFor("instDataLoad");

  if (getById("display")) {
    getById("display").removeEventListener("click", playFromClick);
  }

  document.addEventListener("mousemove", mouseMove);
  document.addEventListener("mouseup", mouseUp);
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("mousedown", mouseDown);

  SetupScaleNotes();

  readyStates.readyUp("melo");
}